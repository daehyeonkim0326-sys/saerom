import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: '허용되지 않은 요청입니다.' }, 405)

  let requestId: unknown
  try {
    ({ requestId } = await request.json())
  } catch {
    return jsonResponse({ error: '상담 접수 정보를 확인할 수 없습니다.' }, 400)
  }
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return jsonResponse({ error: '상담 접수 정보를 확인할 수 없습니다.' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('실패한 상담 평면도 정리 함수에 필요한 Supabase 설정이 없습니다.')
    return jsonResponse({ error: '평면도 정리 기능이 설정되지 않았습니다.' }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: linkedRequest, error: requestError } = await adminClient
    .from('consultation_requests')
    .select('id')
    .eq('id', requestId)
    .maybeSingle()

  if (requestError) {
    console.error('평면도 정리 전 상담 신청을 확인하지 못했습니다.', requestError)
    return jsonResponse({ error: '상담 신청 정보를 확인하지 못했습니다.' }, 500)
  }
  if (linkedRequest) return jsonResponse({ error: '접수된 상담의 평면도는 삭제할 수 없습니다.' }, 409)

  const bucket = adminClient.storage.from('consultation-floor-plans')
  let offset = 0
  const paths: string[] = []
  while (true) {
    const { data: files, error: listError } = await bucket.list(requestId, { limit: 100, offset })
    if (listError) {
      console.error('접수 실패 평면도 파일을 조회하지 못했습니다.', listError)
      return jsonResponse({ error: '평면도 파일을 확인하지 못했습니다.' }, 500)
    }
    for (const file of files ?? []) {
      if (file.id) paths.push(`${requestId}/${file.name}`)
    }
    if (!files || files.length < 100) break
    offset += files.length
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error: removeError } = await bucket.remove(paths.slice(index, index + 100))
    if (removeError) {
      console.error('접수 실패 평면도 파일을 삭제하지 못했습니다.', removeError)
      return jsonResponse({ error: '평면도 파일을 정리하지 못했습니다.' }, 500)
    }
  }

  return jsonResponse({ removedCount: paths.length })
})
