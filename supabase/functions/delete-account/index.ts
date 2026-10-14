const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve((request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return new Response(
    JSON.stringify({
      error: '회원 탈퇴 기능은 데이터 삭제 문제를 확인하기 위해 일시 중지되었습니다.',
    }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})
