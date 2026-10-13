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
  const appSiteUrl = Deno.env.get('APP_SITE_URL')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !appSiteUrl) {
    console.error('초대 함수에 필요한 Supabase 환경 설정이 없습니다.')
    return jsonResponse({ error: '관리자 초대 기능이 설정되지 않았습니다.' }, 500)
  }

  const token = authorization.slice('Bearer '.length)
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user: caller }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !caller) {
    return jsonResponse({ error: '로그인 정보를 확인할 수 없습니다.' }, 401)
  }
  if (caller.app_metadata?.role !== 'admin') {
    return jsonResponse({ error: '관리자만 다른 계정을 초대할 수 있습니다.' }, 403)
  }

  let email: unknown
  try {
    ({ email } = await request.json())
  } catch {
    return jsonResponse({ error: '이메일 주소를 확인해 주세요.' }, 400)
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return jsonResponse({ error: '올바른 이메일 주소를 입력해 주세요.' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  let user
  let message = '초대 메일을 보냈고, 계정에 관리자 권한을 설정했습니다.'

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email.trim(),
    { redirectTo: appSiteUrl },
  )

  if (inviteData?.user) {
    user = inviteData.user
  } else if (inviteError && /already been registered|already exists|already registered/i.test(inviteError.message)) {
    const normalizedEmail = email.trim().toLowerCase()
    const perPage = 1000

    for (let page = 1; ; page += 1) {
      const { data, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage })
      if (listError) {
        console.error('기존 계정을 조회하지 못했습니다.', listError)
        return jsonResponse({ error: '기존 계정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500)
      }

      user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)
      if (user || data.users.length < perPage) break
    }

    if (!user) {
      console.error('중복 초대 이메일과 일치하는 계정을 찾지 못했습니다.', inviteError)
      return jsonResponse({ error: '가입된 계정을 찾지 못했습니다. 이메일 주소를 확인해 주세요.' }, 404)
    }
    message = user.app_metadata?.role === 'admin'
      ? '해당 계정은 이미 관리자입니다.'
      : '기존 회원 계정에 관리자 권한을 부여했습니다.'
  } else {
    console.error('관리자 초대 메일을 보내지 못했습니다.', inviteError)
    return jsonResponse({
      error: inviteError?.message ?? '초대 메일을 보내지 못했습니다.',
    }, 400)
  }

  const { error: roleError } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'admin' },
  })
  if (roleError) {
    console.error('초대 계정에 관리자 권한을 설정하지 못했습니다.', roleError)
    return jsonResponse({
      error: '초대 메일은 발송했지만 관리자 권한 설정에 실패했습니다. Supabase 관리자에게 문의해 주세요.',
    }, 500)
  }

  return jsonResponse({ message })
})
