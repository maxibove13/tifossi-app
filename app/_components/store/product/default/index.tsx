import { memo } from 'react'
import type { DefaultCardProps } from '../types'
import DefaultSmallCard from './small'
import DefaultLargeCard from './large'

function DefaultCard({ size = 'small', ...props }: DefaultCardProps) {
  if (size === 'large') {
    return <DefaultLargeCard {...props} />
  }
  
  return <DefaultSmallCard {...props} />
}

export default memo(DefaultCard) 