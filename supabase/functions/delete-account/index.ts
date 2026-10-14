import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, string>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: '허용되지 않은 요청입니다.' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: '로그인이 필요합니다.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('회원 탈퇴 함수에 필요한 Supabase 환경 설정이 없습니다.')
    return jsonResponse({ error: '회원 탈퇴 기능이 설정되지 않았습니다.' }, 500)
  }

  const token = authorization.slice('Bearer '.length)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user: caller }, error: authError } = await userClient.auth.getUser(token)
  if (authError || !caller) {
    return jsonResponse({ error: '로그인 정보를 확인할 수 없습니다.' }, 401)
  }
  if (caller.app_metadata?.role === 'admin') {
    return jsonResponse({ error: '관리자 권한을 먼저 해제한 뒤 회원 탈퇴를 진행해 주세요.' }, 409)
  }

  const { error: preparationError } = await userClient.rpc(
    'prepare_own_account_deletion',
  )
  if (preparationError) {
    if (preparationError.message.includes('관리자 권한을 먼저 해제')) {
      return jsonResponse({ error: preparationError.message }, 409)
    }
    console.error('회원 탈퇴를 준비하지 못했습니다.', preparationError)
    return jsonResponse({ error: '회원 탈퇴를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: deletionError } = await adminClient.auth.admin.deleteUser(caller.id)
  if (deletionError) {
    console.error('회원 계정을 삭제하지 못했습니다.', deletionError)
    return jsonResponse({ error: '회원 계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500)
  }

  let imageCleanupFailed = false
  const bucket = adminClient.storage.from('community-post-images')
  const imagePaths: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data: files, error: listError } = await bucket.list(caller.id, {
      limit: 1000,
      offset,
    })
    if (listError) {
      console.error('탈퇴한 회원의 게시물 이미지를 조회하지 못했습니다.', listError)
      imageCleanupFailed = true
      break
    }

    if (files.length === 0) break

    imagePaths.push(...files.map((file) => `${caller.id}/${file.name}`))
    if (files.length < 1000) break
  }

  for (let index = 0; index < imagePaths.length; index += 100) {
    const { error: removeError } = await bucket.remove(imagePaths.slice(index, index + 100))
    if (removeError) {
      console.error('탈퇴한 회원의 게시물 이미지를 삭제하지 못했습니다.', removeError)
      imageCleanupFailed = true
    }
  }

  return jsonResponse({
    message: imageCleanupFailed
      ? '회원 탈퇴는 완료되었지만 일부 게시물 이미지를 정리하지 못했습니다.'
      : '회원 탈퇴가 완료되었습니다.',
  })
})
