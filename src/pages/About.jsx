import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../component/common/Header.jsx'
import Footer from '../component/common/Footer.jsx'
import './About.scss'
import img1 from '../assets/img/about.JPG'
const ScrollReveal = ({ as: Tag = 'p', className = '', delay = 0, children, ...props }) => {
  return (
    <Tag
      {...props}
      className={`about-page__scroll-reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

const About = ({ isLoggedIn, onToggleLogin }) => {
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const scrollDirectionRef = useRef(0)

  useEffect(() => {
    const revealItems = pageRef.current?.querySelectorAll('.about-page__scroll-reveal')
    if (!revealItems?.length) return undefined
    const heroItems = pageRef.current.querySelectorAll('.about-page__hero .about-page__scroll-reveal')

    let previousScrollY = window.scrollY
    if (previousScrollY === 0) {
      heroItems?.forEach((item) => item.classList.add('is-visible'))
    }

    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - previousScrollY
      if (Math.abs(scrollDelta) > 2) {
        scrollDirectionRef.current = Math.sign(scrollDelta)
        if (scrollDelta < 0) {
          revealItems.forEach((item) => item.classList.remove('is-visible'))
        } else {
          revealItems.forEach((item) => {
            const bounds = item.getBoundingClientRect()
            if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
              item.classList.add('is-visible')
            }
          })
        }
      }
      previousScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScrollDirection, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScrollDirection)
    }
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return undefined

    let animationFrame = 0
    const updateZoom = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        if (!hero.clientWidth) return
        const progress = Math.min(Math.max(window.scrollY / 140, 0), 1)
        const initialInset = Math.min(400, Math.max(0, (window.innerWidth - 320) / 2))
        hero.style.setProperty('--hero-image-inset', `${(initialInset * (1 - progress)).toFixed(1)}px`)
        hero.style.setProperty('--hero-zoom', (1 + progress * 0.12).toFixed(3))
        hero.style.setProperty('--hero-blur', `${(progress * 8).toFixed(2)}px`)
      })
    }

    updateZoom()
    window.addEventListener('scroll', updateZoom, { passive: true })
    window.addEventListener('resize', updateZoom)
    return () => {
      window.removeEventListener('scroll', updateZoom)
      window.removeEventListener('resize', updateZoom)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
      <main className='about-page' ref={pageRef}>
        <section className='about-page__hero' ref={heroRef}>
          <ScrollReveal className='about-page__eyebrow'>ABOUT SAEROM</ScrollReveal>
          <h1 className='about-page__hero-title'>
            <ScrollReveal as='span' delay={100}>
              공간에 <span className='about-page__highlight about-page__highlight--yellow'>새로움</span>을,
            </ScrollReveal>
            <ScrollReveal as='span' delay={220}>
              일상에 <span className='about-page__highlight about-page__highlight--blue'>편안함</span>을.
            </ScrollReveal>
          </h1>
          <ScrollReveal className='about-page__intro' delay={340}>
            새롬 인테리어는 공간을 사용하는 사람의 마음과 생활을 먼저 생각합니다. <br />
            취향과 쓰임을 세심하게 담아 오래 머물고 싶은 공간을 만들어갑니다.
          </ScrollReveal>
        </section>

      <section className='about-page__story'>
        <div className='about-page__story-visual'>
          <img className='about-page__story-image about-page__scroll-reveal' src={img1} alt='새롬 인테리어 스토리' />
          <div className='about-page__story-overlay'>
            <ScrollReveal className='about-page__eyebrow'>OUR APPROACH</ScrollReveal>
            <ScrollReveal as='h2' delay={120}>좋은 공간은<br />좋은 대화에서 시작됩니다.</ScrollReveal>
          </div>
        </div>
        <div className='about-page__story-copy'>
          <ScrollReveal>
            어떤 분위기를 좋아하는지, 하루를 어떻게 보내는지,
            공간에 바라는 점은 무엇인지 충분히 듣는 것부터 시작합니다.
          </ScrollReveal>
          <ScrollReveal delay={160}>
            작은 디테일까지 함께 고민하며, 보기 좋은 공간을 넘어
            매일의 생활에 자연스럽게 어울리는 인테리어를 제안합니다.
          </ScrollReveal>
        </div>
      </section>

      <section className='about-page__values' aria-label='새롬 인테리어의 가치'>
        <article>
          <span>01</span>
          <ScrollReveal as='h2'>먼저 듣기</ScrollReveal>
          <ScrollReveal delay={120}>고객의 취향과 생활 방식을 충분히 이해하고 시작합니다.</ScrollReveal>
        </article>
        <article>
          <span>02</span>
          <ScrollReveal as='h2'>꼼꼼한 고민</ScrollReveal>
          <ScrollReveal delay={120}>공간의 기능과 분위기, 디테일을 함께 살핍니다.</ScrollReveal>
        </article>
        <article>
          <span>03</span>
          <ScrollReveal as='h2'>오래 편안하게</ScrollReveal>
          <ScrollReveal delay={120}>오늘뿐 아니라 매일의 일상에 잘 어울리는 공간을 생각합니다.</ScrollReveal>
        </article>
      </section>

      <section className='about-page__contact'>
        <ScrollReveal className='about-page__eyebrow'>LET'S TALK</ScrollReveal>
        <ScrollReveal as='h2' delay={120}>새로운 공간을 함께 이야기해요.</ScrollReveal>
        <div className='about-page__contact-actions'>
          <ScrollReveal as={Link} className='about-page__scroll-link' delay={240} to='/consultation'>
            상담 신청하기
          </ScrollReveal>
          <ScrollReveal
            as='a'
            className='about-page__scroll-link'
            delay={320}
            href='https://map.naver.com/p/search/강원특별자치도%20원주시%20늘품로%20126%20단구동'
            target='_blank'
            rel='noreferrer'
          >
            오시는 길
          </ScrollReveal>
        </div>
      </section>
      </main>
      <Footer />
    </>
  )
}

export default About
