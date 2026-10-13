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
      </div>
    </footer>
  )
}

export default Footer