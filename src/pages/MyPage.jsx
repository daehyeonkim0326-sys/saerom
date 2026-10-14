import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import './MyPage.scss'

const providerLabels = {
  email: '이메일',
  google: 'Google',
  kakao: '카카오',
  naver: '네이버',
}

const MyPage = ({ isLoggedIn, isAdmin, onToggleLogin }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adminInviteEmail, setAdminInviteEmail] = useState('')
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [adminActionError, setAdminActionError] = useState('')
  const [isAdminActionPending, setIsAdminActionPending] = useState(false)

  useEffect(() => {
    let isMounted = true

    if (!isLoggedIn || !supabase) {
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return
      if (error) console.error('계정 정보를 불러오지 못했습니다.', error)
      setUser(data.user)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  const handleInviteAdmin = async (event) => {
    event.preventDefault()
    setAdminActionMessage('')
    setAdminActionError('')
    setIsAdminActionPending(true)

    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { email: adminInviteEmail.trim() },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setAdminInviteEmail('')
      setAdminActionMessage(data.message)
    } catch (error) {
      console.error('관리자 초대를 보내지 못했습니다.', error)
      let errorMessage = error?.message || '관리자 초대를 보내지 못했습니다.'
      if (error?.context instanceof Response) {
        try {
          const response = await error.context.clone().json()
          if (typeof response?.error === 'string') errorMessage = response.error
        } catch (responseError) {
          console.error('초대 오류 응답을 읽지 못했습니다.', responseError)
        }
      }
      if (
        error?.name === 'FunctionsFetchError'
        || /failed to send a request to the edge function/i.test(errorMessage)
      ) {
        errorMessage = 'Supabase의 invite-admin Edge Function에 연결하지 못했습니다. 함수가 배포되어 있는지, 현재 앱이 같은 Supabase 프로젝트를 사용 중인지 확인해 주세요. 재배포 후에도 계속되면 Supabase Edge Function 로그에서 원인을 확인해 주세요.'
      }
      setAdminActionError(errorMessage)
    } finally {
      setIsAdminActionPending(false)
    }
  }

  const handleRevokeAdmin = async () => {
    const confirmed = window.confirm(
      '본인의 관리자 권한을 해제할까요? 마지막 관리자는 해제할 수 없으며, 계정은 유지됩니다.',
    )
    if (!confirmed) return

    setAdminActionMessage('')
    setAdminActionError('')
    setIsAdminActionPending(true)
    try {
      const { error } = await supabase.rpc('revoke_own_admin_role')
      if (error) throw error

      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) throw refreshError
      setAdminActionMessage('관리자 권한을 해제했습니다.')
    } catch (error) {
      console.error('관리자 권한을 해제하지 못했습니다.', error)
      setAdminActionError(error?.message?.includes('마지막 관리자')
        ? '마지막 관리자 계정은 관리자 권한을 해제할 수 없습니다.'
        : '관리자 권한을 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsAdminActionPending(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <main className='my-page'>
        <section className='my-page__notice'>
          <h1>로그인이 필요합니다</h1>
          <p>마이페이지를 보려면 먼저 로그인해 주세요.</p>
          <Link to='/'>홈으로 돌아가기</Link>
        </section>
      </main>
    )
  }

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.user_metadata?.nickname
    || '새롬 회원'
  const provider = user?.app_metadata?.provider

  return (
    <main className='my-page'>
      <div className='my-page__content'>
        <header className='my-page__heading'>
          <p>MY SAEROM</p>
          <h1>마이페이지</h1>
          <span>{displayName}님, 반갑습니다.</span>
        </header>

        <section className='my-page__account' aria-labelledby='my-page-account-title'>
          <div className='my-page__section-heading'>
            <div>
              <p>ACCOUNT</p>
              <h2 id='my-page-account-title'>계정 정보</h2>
            </div>
          </div>

          {isLoading ? (
            <p className='my-page__loading' role='status'>계정 정보를 불러오는 중입니다.</p>
          ) : (
            <dl className='my-page__details'>
              <div>
                <dt>이름</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{user?.email || '이메일 정보 없음'}</dd>
              </div>
              <div>
                <dt>로그인 방식</dt>
                <dd>{providerLabels[provider] || provider || '확인할 수 없음'}</dd>
              </div>
            </dl>
          )}
        </section>

        <div className='my-page__actions'>
          <Link to='/my-posts'>내가 쓴 글</Link>
          {isAdmin && <Link to='/admin/consultations'>상담 신청 관리</Link>}
          <button type='button' onClick={onToggleLogin}>로그아웃</button>
        </div>

        <section className='my-page__danger-zone' aria-labelledby='my-page-withdraw-title'>
          <div className='my-page__section-heading'>
            <div>
              <p>ACCOUNT</p>
              <h2 id='my-page-withdraw-title'>회원 탈퇴</h2>
            </div>
          </div>
          <p>문제 확인을 위해 회원 탈퇴를 일시 중지했습니다. 현재는 이 버튼으로 계정이나 게시물이 삭제되지 않습니다.</p>
          <button type='button' disabled>회원 탈퇴 일시 중지</button>
        </section>

        {isAdmin && (
          <section className='my-page__admin-tools' aria-labelledby='my-page-admin-title'>
            <div className='my-page__section-heading'>
              <div>
                <p>ADMIN</p>
                <h2 id='my-page-admin-title'>관리자 계정 관리</h2>
              </div>
            </div>
            <form className='my-page__admin-invite' onSubmit={handleInviteAdmin}>
              <label htmlFor='admin-invite-email'>초대할 계정 이메일</label>
              <div>
                <input
                  id='admin-invite-email'
                  type='email'
                  autoComplete='email'
                  value={adminInviteEmail}
                  onChange={(event) => setAdminInviteEmail(event.target.value)}
                  placeholder='name@example.com'
                  required
                  disabled={isAdminActionPending}
                />
                <button type='submit' disabled={isAdminActionPending}>
                  {isAdminActionPending ? '처리 중...' : '관리자 초대'}
                </button>
              </div>
              <p>초대 메일을 받은 계정에는 관리자 권한이 부여됩니다.</p>
            </form>
            <button
              className='my-page__admin-revoke'
              type='button'
              onClick={handleRevokeAdmin}
              disabled={isAdminActionPending}
            >
              내 관리자 권한 해제
            </button>
            {adminActionMessage && <p className='my-page__admin-message' role='status'>{adminActionMessage}</p>}
            {adminActionError && <p className='my-page__admin-error' role='alert'>{adminActionError}</p>}
          </section>
        )}
      </div>
    </main>
  )
}

export default MyPage