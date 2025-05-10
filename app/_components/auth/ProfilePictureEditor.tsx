import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../_styles/colors';
import { radius } from '../../_styles/spacing';
import PencilIcon from '../../../assets/icons/pencil.svg';

interface ProfilePictureEditorProps {
  currentImage: string | null;
  size?: number;
  onImageChange?: (imageUri: string | null) => void;
}

export default function ProfilePictureEditor({
  currentImage,
  size = 64,
  onImageChange,
}: ProfilePictureEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  // This would normally use expo-image-picker, but we'll mock it for now
  const pickImage = async () => {
    setIsUploading(true);

    try {
      // Mock the image selection and upload process
      // In a real implementation, we would use:
      // const result = await ImagePicker.launchImageLibraryAsync({
      //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
      //   allowsEditing: true,
      //   aspect: [1, 1],
      //   quality: 0.8,
      // });

      // For demo, simulate a delay and a mock result
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock result - in a real implementation this would come from expo-image-picker
      const mockResult = {
        canceled: false,
        assets: [{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }],
      };

      if (!mockResult.canceled && mockResult.assets[0]) {
        const imageUri = mockResult.assets[0].uri;

        // In a real implementation, we would also upload to server:
        // await updateProfilePicture(imageUri);

        // Notify parent component if needed
        if (onImageChange) {
          onImageChange(imageUri);
        }

        // Success message
        Alert.alert('Éxito', 'Imagen de perfil actualizada correctamente.');
      }
    } catch (error) {
      console.error('Error picking or uploading image:', error);
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const openImageActionSheet = () => {
    Alert.alert('Imagen de Perfil', '¿Qué acción deseas realizar?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Seleccionar Foto',
        onPress: pickImage,
      },
      {
        text: 'Eliminar Foto',
        style: 'destructive',
        onPress: () => {
          if (onImageChange) {
            onImageChange(null);
          }
          Alert.alert('Éxito', 'Imagen de perfil eliminada.');
        },
      },
    ]);
  };

  const containerSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const iconContainerSize = {
    top: -size * 0.06,
    right: -size * 0.06,
    padding: size * 0.06,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={openImageActionSheet}
        disabled={isUploading}
        style={[styles.profilePictureContainer, containerSize]}
      >
        {isUploading ? (
          <View style={[styles.profileIconContainer, containerSize]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : currentImage ? (
          <Image source={{ uri: currentImage }} style={[styles.profilePicture, containerSize]} />
        ) : (
          <View style={[styles.profileIconContainer, containerSize]}>
            <Feather name="user" size={size * 0.5} color={colors.primary} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.editIconContainer, iconContainerSize]}
          onPress={openImageActionSheet}
          disabled={isUploading}
        >
          <PencilIcon
            width={size * 0.18}
            height={size * 0.18}
            stroke={colors.background.light}
            strokeWidth={1.2}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profilePicture: {
    backgroundColor: colors.border,
  },
  profileIconContainer: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    backgroundColor: colors.border,
    borderRadius: radius.circle,
    borderWidth: 1.5,
    borderColor: colors.background.light,
  },
});
