import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js'
import './LoginModal.scss'

const authRedirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString()

const socialProviders = [
  { id: 'kakao', label: '카카오로 계속하기', mark: 'K' },
  { id: 'google', label: 'Google로 계속하기', mark: 'G' },
]

const getAuthErrorMessage = (error) => {
  const message = error?.message ?? ''

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return '인증 서버에 연결할 수 없습니다. 네트워크와 Supabase 설정을 확인해 주세요.'
  }
  if (/redirect.*(allow|url)|url.*not allowed/i.test(message)) {
    return '인증 이동 주소가 Supabase 허용 목록에 없습니다. Authentication의 URL Configuration에 현재 사이트 주소를 추가해 주세요.'
  }
  if (/provider.*not enabled/i.test(message)) return '이 로그인 방식이 인증 서버에서 활성화되지 않았습니다.'

  return message || '인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

const LoginModal = ({ onClose, onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAuthError, setHasAuthError] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSocialLogin = async (provider) => {
    setNotice('')
    setHasAuthError(false)

    if (isSignUp && !privacyConsent) {
      setHasAuthError(true)
      setNotice('회원가입을 계속하려면 필수 개인정보 수집·이용에 동의해 주세요.')
      return
    }

    if (!isSupabaseConfigured) {
      setHasAuthError(true)
      setNotice('인증 서버 설정이 필요합니다. .env에 Supabase 프로젝트 정보를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: authRedirectUrl },
      })
      if (error) throw error
    } catch (error) {
      setHasAuthError(true)
      setNotice(getAuthErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  const switchMode = () => {
    setIsSignUp((current) => !current)
    setPrivacyConsent(false)
    setHasAuthError(false)
    setNotice('')
  }

  return (
    <div
      className='login-modal__backdrop'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className='login-modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='login-modal-title'
      >
        <button className='login-modal__close' type='button' onClick={onClose} aria-label='닫기'>
          ×
        </button>

        <div className='login-modal__heading'>
          <span className='login-modal__eyebrow'>SAEROM INTERIOR</span>
          <h2 id='login-modal-title'>
            {isSignUp ? '새롬에 오신 걸 환영해요' : '어서 오세요'}
          </h2>
          <p>
            {isSignUp ? '계정을 만들고 이야기를 나눠보세요.' : '로그인하고 새롬의 이야기를 이어가세요.'}
          </p>
        </div>

        {isSignUp && (
          <section className='login-modal__privacy' aria-labelledby='signup-privacy-title'>
            <h3 id='signup-privacy-title'>필수 개인정보 수집·이용 동의</h3>
            <p><strong>목적</strong> 회원 가입 및 로그인</p>
            <p><strong>항목</strong> 소셜 계정 식별 정보와 제공된 프로필 정보</p>
            <p><strong>보유 기간</strong> 회원 탈퇴 시까지. 탈퇴하면 계정은 삭제됩니다. 다만 공개 게시물과 사진은 유지되며, 작성자 연결을 해제합니다.</p>
            <p>동의를 거부할 권리가 있으며, 거부하면 회원가입을 할 수 없습니다.</p>
            <label>
              <input
                type='checkbox'
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
              />
              필수 개인정보 수집·이용에 동의합니다.
            </label>
            <small>
              근거: <a href='https://www.law.go.kr/법령/개인정보보호법/제15조' target='_blank' rel='noreferrer'>개인정보 보호법 제15조</a>,{' '}
              <a href='https://www.law.go.kr/법령/개인정보보호법/제22조' target='_blank' rel='noreferrer'>제22조</a>,{' '}
              <a href='https://www.law.go.kr/법령/개인정보보호법/제30조' target='_blank' rel='noreferrer'>제30조</a>
            </small>
            <p><a href={`${import.meta.env.BASE_URL}privacy`}>개인정보 처리방침 보기</a></p>
          </section>
        )}

        <div className='login-modal__divider'><span>소셜 계정으로 {isSignUp ? '회원가입' : '로그인'}</span></div>

        <div className='login-modal__socials'>
          {socialProviders.map(({ id, label, mark }) => (
            <button
              className={`login-modal__social login-modal__social--${id}`}
              key={id}
              type='button'
              onClick={() => handleSocialLogin(id)}
              disabled={isSubmitting}
            >
              <span aria-hidden='true'>{mark}</span>
              {label}
            </button>
          ))}
        </div>

        <p className='login-modal__switch'>
          {isSignUp ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}{' '}
          <button type='button' onClick={switchMode}>
            {isSignUp ? '로그인' : '회원가입'}
          </button>
        </p>

        {notice && (
          <p className='login-modal__notice' aria-live='polite' role={hasAuthError ? 'alert' : undefined}>
            {notice}
          </p>
        )}
      </section>
    </div>
  )
}

export default LoginModal
