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
        <div className='site-footer__contact' aria-label='사업자 및 연락처 정보'>
          <p>대표 : 김명열 | 사업자등록번호 : 108-74-00469</p>
          <p>
            대표번호 : <a href='tel:010-4991-9060'>010-4991-9060</a>
            {' | '}
            휴대폰번호 : <a href='tel:010-2563-6855'>010-2563-6855</a>
          </p>
        </div>
        <p className='site-footer__address'>주소 : 강원특별자치도 원주시 늘품로 126 (단구동)</p>
        <p className='site-footer__hours'>운영시간 : 오전 8시 ~ 오후 8시</p>
        <p className='site-footer__copyright'>Copyright © <strong>새롬인테리어.</strong> All rights reserved.</p>
        <nav className='site-footer__socials' aria-label='새롬 인테리어 소셜 미디어'>
          <a
            href='https://blog.naver.com/sr_interior'
            target='_blank'
            rel='noreferrer'
            aria-label='네이버 블로그 새 탭에서 열기'
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
