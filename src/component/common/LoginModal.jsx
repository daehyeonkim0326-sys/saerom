import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js'
import './LoginModal.scss'

const authRedirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString()

const socialProviders = [
  { id: 'kakao', label: '카카오로 계속하기', mark: 'K' },
  { id: 'naver', label: '네이버로 계속하기', mark: 'N' },
  { id: 'google', label: 'Google로 계속하기', mark: 'G' },
]

const getAuthErrorMessage = (error) => {
  const message = error?.message ?? ''

  if (/invalid login credentials/i.test(message)) return '아이디 혹은 비밀번호가 다릅니다.'
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return '인증 서버에 연결할 수 없습니다. 네트워크와 Supabase 설정을 확인해 주세요.'
  }
  if (/user already registered/i.test(message)) return '이미 가입된 이메일입니다. 로그인해 주세요.'
  if (/password/i.test(message)) return '비밀번호를 확인해 주세요. 비밀번호는 8자 이상이어야 합니다.'
  if (/provider.*not enabled/i.test(message)) return '이 로그인 방식이 인증 서버에서 활성화되지 않았습니다.'

  return message || '인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

const LoginModal = ({ onClose, onAuthenticated, isPasswordRecovery = false }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasLoginError, setHasLoginError] = useState(false)
  const [hasAuthError, setHasAuthError] = useState(false)
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0)
  const [recoveryMode, setRecoveryMode] = useState(isPasswordRecovery ? 'reset-password' : 'login')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [notice, setNotice] = useState('')
  const emailRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    if (recoveryMode === 'login') emailRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, recoveryMode])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setHasLoginError(false)
    setHasAuthError(false)

    if (!isSupabaseConfigured) {
      setHasAuthError(true)
      setNotice('인증 서버 설정이 필요합니다. .env에 Supabase 프로젝트 정보를 입력해 주세요.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl },
        })
        if (error) throw error
        if (data.session) {
          onAuthenticated()
          return
        }
        setNotice('확인 메일을 보냈습니다. 이메일 인증을 완료한 뒤 로그인해 주세요.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onAuthenticated()
    } catch (error) {
      setHasAuthError(true)
      if (!isSignUp && /invalid login credentials/i.test(error?.message ?? '')) {
        setHasLoginError(true)
        setFailedLoginAttempts((attempts) => attempts + 1)
      }
      setNotice(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    setNotice('')
    setHasAuthError(false)

    if (provider === 'naver') {
      setNotice('현재 인증 서버에서는 Naver 로그인을 지원하지 않습니다. Google 또는 Kakao를 이용해 주세요.')
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
    setHasLoginError(false)
    setHasAuthError(false)
    setFailedLoginAttempts(0)
    setRecoveryMode('login')
    setNotice('')
  }

  const clearLoginError = () => {
    setHasLoginError(false)
    setHasAuthError(false)
    setNotice('')
  }

  const openRecoveryMode = (mode) => {
    setRecoveryEmail(emailRef.current?.value ?? '')
    setRecoveryMode(mode)
    setHasAuthError(false)
    setNotice('')
  }

  const returnToLogin = () => {
    setRecoveryMode('login')
    setHasAuthError(false)
    setNotice('')
  }

  const handlePasswordResetRequest = async (event) => {
    event.preventDefault()
    setHasAuthError(false)
    setNotice('')

    if (!isSupabaseConfigured) {
      setHasAuthError(true)
      setNotice('인증 서버 설정이 필요합니다. .env에 Supabase 프로젝트 정보를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: authRedirectUrl,
      })
      if (error) throw error
      setNotice('계정이 등록된 이메일이라면 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해 주세요.')
    } catch (error) {
      setHasAuthError(true)
      setNotice(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    setHasAuthError(false)
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const password = formData.get('new-password')
    const confirmPassword = formData.get('confirm-password')
    if (password !== confirmPassword) {
      setHasAuthError(true)
      setNotice('새 비밀번호가 서로 다릅니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setRecoveryMode('complete')
      setNotice('비밀번호가 변경되었습니다. 완료를 눌러 계속해 주세요.')
    } catch (error) {
      setHasAuthError(true)
      setNotice(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
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
            {recoveryMode === 'find-id'
              ? '아이디 찾기'
              : recoveryMode === 'forgot-password'
                ? '비밀번호 찾기'
                : recoveryMode === 'reset-password'
                  ? '새 비밀번호 설정'
                  : recoveryMode === 'complete'
                    ? '비밀번호 변경 완료'
                    : isSignUp
                      ? '새롬에 오신 걸 환영해요'
                      : '어서 오세요'}
          </h2>
          <p>
            {recoveryMode === 'find-id'
              ? '새롬 로그인 아이디는 가입 시 사용한 이메일 주소입니다.'
              : recoveryMode === 'forgot-password'
                ? '가입한 이메일 주소로 비밀번호 재설정 링크를 보내드립니다.'
                : recoveryMode === 'reset-password'
                  ? '새로 사용할 비밀번호를 입력해 주세요.'
                  : recoveryMode === 'complete'
                    ? '새 비밀번호로 계정에 계속할 수 있습니다.'
                    : isSignUp
                      ? '계정을 만들고 이야기를 나눠보세요.'
                      : '로그인하고 새롬의 이야기를 이어가세요.'}
          </p>
        </div>

        {recoveryMode === 'login' ? (
          <>
            <form
              className={`login-modal__form${hasLoginError ? ' login-modal__form--error' : ''}`}
              onSubmit={handleSubmit}
            >
              <label htmlFor='login-email'>이메일 주소</label>
              <input
                ref={emailRef}
                id='login-email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='name@example.com'
                defaultValue={recoveryEmail}
                required
                disabled={isSubmitting}
                aria-invalid={hasLoginError || undefined}
                onChange={(event) => {
                  setRecoveryEmail(event.target.value)
                  clearLoginError()
                }}
              />

              <label htmlFor='login-password'>비밀번호</label>
              <input
                id='login-password'
                name='password'
                type='password'
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder='8자 이상 입력해 주세요'
                minLength={8}
                required
                disabled={isSubmitting}
                aria-invalid={hasLoginError || undefined}
                onChange={clearLoginError}
              />

              <button className='login-modal__submit' type='submit' disabled={isSubmitting}>
                {isSubmitting ? '처리 중...' : isSignUp ? '이메일로 회원가입' : '이메일로 로그인'}
              </button>
            </form>

            {!isSignUp && failedLoginAttempts >= 4 && (
              <div className='login-modal__recovery-actions'>
                <button type='button' onClick={() => openRecoveryMode('find-id')}>
                  아이디 찾기
                </button>
                <button type='button' onClick={() => openRecoveryMode('forgot-password')}>
                  비밀번호 찾기
                </button>
              </div>
            )}

            <div className='login-modal__divider'><span>또는 소셜 계정으로</span></div>

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
          </>
        ) : recoveryMode === 'forgot-password' ? (
          <form className='login-modal__form' onSubmit={handlePasswordResetRequest}>
            <label htmlFor='recovery-email'>가입한 이메일 주소</label>
            <input
              id='recovery-email'
              name='email'
              type='email'
              autoComplete='email'
              placeholder='name@example.com'
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <button className='login-modal__submit' type='submit' disabled={isSubmitting}>
              {isSubmitting ? '보내는 중...' : '재설정 링크 보내기'}
            </button>
            <button className='login-modal__back' type='button' onClick={returnToLogin}>
              로그인으로 돌아가기
            </button>
          </form>
        ) : recoveryMode === 'find-id' ? (
          <div className='login-modal__recovery-info'>
            <p>가입할 때 사용한 이메일 주소가 아이디입니다. 이메일 받은편지함에서 새롬 가입 확인 메일을 검색해 보세요.</p>
            <p>계정 보호를 위해 가입된 이메일 주소를 이 화면에서 직접 조회하지 않습니다.</p>
            <button className='login-modal__back' type='button' onClick={returnToLogin}>
              로그인으로 돌아가기
            </button>
          </div>
        ) : recoveryMode === 'reset-password' ? (
          <form className='login-modal__form' onSubmit={handlePasswordUpdate}>
            <label htmlFor='new-password'>새 비밀번호</label>
            <input
              id='new-password'
              name='new-password'
              type='password'
              autoComplete='new-password'
              minLength={8}
              placeholder='8자 이상 입력해 주세요'
              required
              disabled={isSubmitting}
            />
            <label htmlFor='confirm-password'>새 비밀번호 확인</label>
            <input
              id='confirm-password'
              name='confirm-password'
              type='password'
              autoComplete='new-password'
              minLength={8}
              placeholder='새 비밀번호를 다시 입력해 주세요'
              required
              disabled={isSubmitting}
            />
            <button className='login-modal__submit' type='submit' disabled={isSubmitting}>
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        ) : (
          <button className='login-modal__submit' type='button' onClick={onAuthenticated}>
            완료
          </button>
        )}

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