import { createClient } from 'npm:@supabase/supabase-js@2'

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
)

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: '허용되지 않은 요청입니다.' }, 405)
  }

  const expectedSecret = Deno.env.get('CONSULTATION_CLEANUP_SECRET')
  if (!expectedSecret || request.headers.get('x-cleanup-secret') !== expectedSecret) {
    return jsonResponse({ error: '인증에 실패했습니다.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('상담 데이터 정리 함수에 필요한 Supabase 설정이 없습니다.')
    return jsonResponse({ error: '상담 데이터 정리 기능이 설정되지 않았습니다.' }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: expiredRequests, error: queryError } = await adminClient
    .from('consultation_requests')
    .select('id, floor_plan_paths')
    .not('completed_at', 'is', null)
    .lte('delete_after', new Date().toISOString())
    .order('delete_after', { ascending: true })
    .limit(100)

  if (queryError) {
    console.error('만료된 상담 신청을 조회하지 못했습니다.', queryError)
    return jsonResponse({ error: '만료된 상담 신청을 조회하지 못했습니다.' }, 500)
  }

  let deletedCount = 0
  let failedCount = 0

  for (const consultation of expiredRequests ?? []) {
    const paths = consultation.floor_plan_paths ?? []
    if (paths.length > 0) {
      const { error: storageError } = await adminClient.storage
        .from('consultation-floor-plans')
        .remove(paths)
      if (storageError) {
        failedCount += 1
        console.error(`상담 ${consultation.id}의 평면도를 삭제하지 못했습니다.`, storageError)
        continue
      }
    }

    const { error: deleteError } = await adminClient
      .from('consultation_requests')
      .delete()
      .eq('id', consultation.id)
    if (deleteError) {
      failedCount += 1
      console.error(`상담 ${consultation.id}의 신청 내역을 삭제하지 못했습니다.`, deleteError)
      continue
    }

    deletedCount += 1
  }

  if (failedCount > 0) {
    return jsonResponse({
      error: '일부 만료된 상담 데이터를 삭제하지 못했습니다.',
      deletedCount,
      failedCount,
    }, 500)
  }

  return jsonResponse({ deletedCount, failedCount })
})
