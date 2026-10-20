import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import './ImageSlider.scss'

const ImageSlider = ({ images = [], title = '', detail = false, openOnImageClick = false, transitionName }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const changeImage = (event, direction) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveIndex((index) => (index + direction + images.length) % images.length)
  }

  useEffect(() => {
    if (!isViewerOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsViewerOpen(false)
      if (event.key === 'ArrowLeft') setActiveIndex((index) => (index - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setActiveIndex((index) => (index + 1) % images.length)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isViewerOpen, images.length])

  if (!images.length) return null

  return (
    <>
    <div className={`image-slider${detail ? ' image-slider--detail' : ''}`} aria-label={`${title} 이미지`}>
      {openOnImageClick ? (
        <img
          className='image-slider__thumbnail'
          src={images[activeIndex]}
          alt=''
          style={transitionName ? { viewTransitionName: transitionName } : undefined}
        />
      ) : (
        <button className='image-slider__image-button' type='button' aria-label='이미지 크게 보기' onClick={() => setIsViewerOpen(true)}>
          <img
            src={images[activeIndex]}
            alt={detail ? `${title} 사진 ${activeIndex + 1}` : ''}
            style={transitionName ? { viewTransitionName: transitionName } : undefined}
          />
        </button>
      )}
      {images.length > 1 && <>
        <button className='image-slider__arrow image-slider__arrow--left' type='button' aria-label='이전 이미지' onClick={(event) => changeImage(event, -1)}>
          <ArrowLeft size={18} aria-hidden='true' />
        </button>
        <button className='image-slider__arrow image-slider__arrow--right' type='button' aria-label='다음 이미지' onClick={(event) => changeImage(event, 1)}>
          <ArrowRight size={18} aria-hidden='true' />
        </button>
        <span className='image-slider__count' aria-live='polite'>{activeIndex + 1} / {images.length}</span>
      </>}
    </div>
    {isViewerOpen && createPortal(<div className='image-viewer' role='dialog' aria-modal='true' aria-label={`${title} 이미지 크게 보기`} onClick={() => setIsViewerOpen(false)}>
        <button className='image-viewer__close' type='button' aria-label='닫기' onClick={() => setIsViewerOpen(false)}><X size={24} /></button>
        {images.length > 1 && <button className='image-viewer__arrow image-viewer__arrow--left' type='button' aria-label='이전 이미지' onClick={(event) => { event.stopPropagation(); setActiveIndex((index) => (index - 1 + images.length) % images.length) }}><ArrowLeft size={24} /></button>}
        <img src={images[activeIndex]} alt={`${title} 사진 ${activeIndex + 1}`} onClick={(event) => event.stopPropagation()} />
        {images.length > 1 && <button className='image-viewer__arrow image-viewer__arrow--right' type='button' aria-label='다음 이미지' onClick={(event) => { event.stopPropagation(); setActiveIndex((index) => (index + 1) % images.length) }}><ArrowRight size={24} /></button>}
        {images.length > 1 && <span className='image-viewer__count'>{activeIndex + 1} / {images.length}</span>}
      </div>, document.body)}
    </>
  )
}

export default ImageSlider
