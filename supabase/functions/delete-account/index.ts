import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const jsonResponse = (body: Record<string, string>, status = 200) => new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
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

  const { error: preparationError } = await userClient.rpc('prepare_own_account_deletion')
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

  return jsonResponse({
    message: '회원 탈퇴가 완료되었습니다. 작성한 게시물과 이미지는 보존됩니다.',
  })
})
