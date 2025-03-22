import { Platform, Share } from 'react-native'
import Button from '../../ui/buttons/Button'

interface ShareButtonProps {
  title?: string
  message: string
  url?: string
  onShareComplete?: () => void
  onShareError?: (error: Error) => void
  size?: 's' | 'l'
}

export default function ShareButton({
  title,
  message,
  url,
  onShareComplete,
  onShareError,
  size = 's',
}: ShareButtonProps) {
  const handleShare = async () => {
    try {
      const shareContent = {
        title,
        message: url ? `${message}\n${url}` : message,
        url: Platform.select({
          ios: url,
          android: url,
        }),
      }

      const result = await Share.share(shareContent, {
        dialogTitle: title,
      })

      if (result.action === Share.sharedAction) {
        onShareComplete?.()
      }
    } catch (error) {
      onShareError?.(error as Error)
    }
  }

  return (
    <Button
      variant="solo-icon"
      icon="share-outline"
      onPress={handleShare}
      style={{
        width: size === 's' ? 32 : 40,
        height: size === 's' ? 32 : 40,
      }}
    />
  )
}