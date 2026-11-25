import { useState } from 'react'
import './ImageCompare.scss'

const ImageCompare = ({ images, title, imageNumbers = [1, 2] }) => {
  const [position, setPosition] = useState(50)
  const [leftImage, rightImage] = images

  if (!leftImage || !rightImage) return null

  return (
    <section className='image-compare' aria-label={`${title} ${imageNumbers[0]}번과 ${imageNumbers[1]}번 사진 비교`}>
      <div className='image-compare__frame' style={{ '--compare-position': `${position}%` }}>
        <img className='image-compare__image' src={leftImage} alt={`${title} 사진 ${imageNumbers[0]}`} />
        <div className='image-compare__reveal'>
          <img className='image-compare__image' src={rightImage} alt={`${title} 사진 ${imageNumbers[1]}`} />
        </div>
        <div className='image-compare__divider' aria-hidden='true'><span /></div>
        <input
          className='image-compare__range'
          type='range'
          min='0'
          max='100'
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label='두 사진이 보이는 비율 조절'
          aria-valuetext={`사진 2가 ${position}% 보임`}
        />
        <span className='image-compare__label image-compare__label--left'>BEFORE</span>
        <span className='image-compare__label image-compare__label--right'>AFTER</span>
      </div>
    </section>
  )
}

export default ImageCompare
