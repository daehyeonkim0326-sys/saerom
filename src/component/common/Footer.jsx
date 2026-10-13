import './Footer.scss'
import logo from '../../assets/img/logo.svg'

const Footer = () => {
  return (
    <footer className='site-footer'>
      <div className='site-footer__content'>
        <a className='site-footer__logo' href='/' aria-label='새롬 인테리어 홈으로 이동'>
            <img src={logo} alt='' />
        </a>
        <p className='site-footer__english-name'>SAEROM INTERIOR</p>
        <h2 className='site-footer__company-name'>새롬 인테리어</h2>
        <div className='site-footer__contact' aria-label='연락처 정보'>
          <p><strong>TEL</strong> <a href='tel:010-2563-6855'>010-2563-6855</a></p>
          <p><strong>E-mail</strong> <a href='mailto:saerom.interior@kakao.com'>saerom.interior@kakao.com</a></p>
        </div>
        <p className='site-footer__address'>강원특별자치도 원주시 늘품로 126 새롬 인테리어</p>
        <p className='site-footer__copyright'>© {new Date().getFullYear()} 새롬 인테리어</p>
        <nav className='site-footer__socials' aria-label='새롬 인테리어 소셜 미디어'>
          <a
            href='https://naver.me/xNLZbbIk'
            target='_blank'
            rel='noreferrer'
            aria-label='네이버 플레이스 새 탭에서 열기'
            title='네이버'
          >
            <span aria-hidden='true'>N</span>
          </a>
          <a
            href='https://www.instagram.com/saerom.interior/?hl=ko'
            target='_blank'
            rel='noreferrer'
            aria-label='인스타그램 새 탭에서 열기'
            title='인스타그램'
          >
            <svg
              viewBox='0 0 24 24'
              width='19'
              height='19'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <rect x='3' y='3' width='18' height='18' rx='5' />
              <circle cx='12' cy='12' r='4' />
              <circle cx='17.5' cy='6.5' r='0.75' fill='currentColor' stroke='none' />
            </svg>
          </a>
        </nav>
      </div>
    </footer>
  )
}

export default Footer