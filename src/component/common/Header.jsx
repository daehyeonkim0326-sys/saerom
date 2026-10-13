import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, UserRound, X } from 'lucide-react'
import './Header.scss'
import logo from '../../assets/img/logo.svg'
import { POST_CATEGORIES } from '../../data/posts.js'

const Header = ({ isLoggedIn, onToggleLogin }) => {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'
  const isAboutPage = pathname === '/about'
  const [isHidden, setIsHidden] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCounselMenuOpen, setIsCounselMenuOpen] = useState(false)
  const [isTransparent, setIsTransparent] = useState(
    () => isAboutPage && window.scrollY <= 8,
  )
  const [aboutBackgroundOpacity, setAboutBackgroundOpacity] = useState(
    () => (isAboutPage || isHomePage) ? Math.min(window.scrollY / 120, 1) : 1,
  )
  const isAtTransparentTop = (isHomePage || isAboutPage) && aboutBackgroundOpacity === 0
  const previousScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0)

      if (isHomePage) {
        const banner = document.querySelector('.banner')
        const isPastBanner = Boolean(banner && banner.getBoundingClientRect().bottom <= 0)
        setIsHidden(isPastBanner)
        setIsTransparent(false)
        setAboutBackgroundOpacity(Math.min(currentScrollY / 120, 1))
        previousScrollY.current = currentScrollY
        return
      }

      if (isAboutPage) {
        setIsHidden(false)
        setIsTransparent(false)
        setAboutBackgroundOpacity(Math.min(currentScrollY / 120, 1))
        previousScrollY.current = currentScrollY
        return
      }

      setIsTransparent(false)
      const scrollDifference = currentScrollY - previousScrollY.current

      if (currentScrollY <= 80) {
        setIsHidden(false)
      } else if (Math.abs(scrollDifference) > 8) {
        setIsHidden(scrollDifference > 0)
      }

      previousScrollY.current = currentScrollY
    }

    previousScrollY.current = Math.max(window.scrollY, 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAboutPage, isHomePage])

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined

    const closeMenuOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        setIsCounselMenuOpen(false)
      }
    }
    const closeMenuOnOutsideClick = (event) => {
      if (!event.target.closest('#header')) {
        setIsMobileMenuOpen(false)
        setIsCounselMenuOpen(false)
      }
    }

    document.addEventListener('keydown', closeMenuOnEscape)
    document.addEventListener('pointerdown', closeMenuOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeMenuOnEscape)
      document.removeEventListener('pointerdown', closeMenuOnOutsideClick)
    }
  }, [isMobileMenuOpen])

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsCounselMenuOpen(false)
  }

  return (
    <header
      id='header'
      style={isAboutPage || isHomePage
        ? { '--header-background-opacity': aboutBackgroundOpacity }
        : undefined}
      className={[
        isHomePage && 'header--home',
        isAboutPage && 'header--about',
        (isTransparent || isAtTransparentTop) && 'header--transparent',
        isHidden && 'header--hidden',
        isMobileMenuOpen && 'header--menu-open',
      ].filter(Boolean).join(' ')}
    >
      <Link to='/' className='header__brand' aria-label='새롬 메인으로 이동'>
        <img src={logo} alt='saerom' />
        <span className='header__brand-name' aria-hidden='true'>
          <span>새롬</span>
          <span>인테리어</span>
        </span>
      </Link>
      <ul id='header-navigation' className='header__nav'>
        <li>
          <Link className='header__nav-link' to='/about' onClick={closeMobileMenu}>About</Link>
        </li>
        <li className={`header__dropdown${isCounselMenuOpen ? ' header__dropdown--open' : ''}`}>
          <button
            type='button'
            className='header__dropdown-trigger'
            aria-haspopup='true'
            aria-expanded={window.matchMedia('(max-width: 560px)').matches
              ? isCounselMenuOpen
              : undefined}
            onClick={() => {
              if (window.matchMedia('(max-width: 560px)').matches) {
                setIsCounselMenuOpen((isOpen) => !isOpen)
              }
            }}
          >
            Counsel
          </button>
          <div className='header__submenu' aria-label='상담 및 게시물 메뉴'>
            <Link to='/consultation' onClick={closeMobileMenu}>상담 신청</Link>
            {POST_CATEGORIES.filter((category) => category !== 'Portfolio').map((category) => (
              <Link key={category} to={`/category/${category}`} onClick={closeMobileMenu}>
                {category}
              </Link>
            ))}
          </div>
        </li>
        <li><Link className='header__nav-link' to='/category/Portfolio' onClick={closeMobileMenu}>Portfolio</Link></li>
      </ul>

      <div className='header__actions'>
        <button type='button' className='header__login' onClick={onToggleLogin}>
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>
        {isLoggedIn && (
          <Link
            to='/mypage'
            className='header__profile'
            aria-label='마이페이지'
            title='마이페이지'
          >
            <UserRound size={19} strokeWidth={2} aria-hidden='true' />
          </Link>
        )}
      </div>
      <button
        type='button'
        className='header__mobile-menu'
        aria-label={isMobileMenuOpen ? '메뉴 닫기' : '카테고리 메뉴 열기'}
        aria-expanded={isMobileMenuOpen}
        aria-controls='header-navigation'
        onClick={() => {
          setIsMobileMenuOpen((isOpen) => !isOpen)
          setIsCounselMenuOpen(false)
        }}
      >
        {isMobileMenuOpen
          ? <X size={23} strokeWidth={2} aria-hidden='true' />
          : <Menu size={23} strokeWidth={2} aria-hidden='true' />}
      </button>
    </header>
  )
}

export default Header