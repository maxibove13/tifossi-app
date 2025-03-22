import { memo } from 'react'
import type { BaseProductCardProps } from '../types'
import MinicardLarge from './large'

function MinicardCard(props: BaseProductCardProps) {
  return <MinicardLarge {...props} />
}

export default memo(MinicardCard) 