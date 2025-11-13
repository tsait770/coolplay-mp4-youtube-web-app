import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface TimeWheelPickerModalProps {
  visible: boolean;
  maxDuration: number;
  initialValue: number;
  mode: 'A' | 'B';
  onConfirm: (timeInSeconds: number) => void;
  onCancel: () => void;
  onScroll?: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const SCROLL_VIEW_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function TimeWheelPickerModal({
  visible,
  maxDuration,
  initialValue,
  mode,
  onConfirm,
  onCancel,
  onScroll,
}: TimeWheelPickerModalProps) {
  const maxMinutes = Math.floor(maxDuration / 60);
  const maxSeconds = Math.floor(maxDuration % 60);

  const initialMinutes = Math.floor(initialValue / 60);
  const initialSeconds = Math.floor(initialValue % 60);

  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [selectedSeconds, setSelectedSeconds] = useState(initialSeconds);

  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        minutesScrollRef.current?.scrollTo({
          y: initialMinutes * ITEM_HEIGHT,
          animated: false,
        });
        secondsScrollRef.current?.scrollTo({
          y: initialSeconds * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialMinutes, initialSeconds]);

  const handleMinutesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, maxMinutes));
    
    if (clampedIndex !== selectedMinutes) {
      setSelectedMinutes(clampedIndex);
      if (onScroll) {
        onScroll();
      }
    }

    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    
    scrollTimerRef.current = setTimeout(() => {
      minutesScrollRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }, 100);
  };

  const handleSecondsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    
    let clampedIndex = Math.max(0, Math.min(index, 59));
    
    if (selectedMinutes === maxMinutes) {
      clampedIndex = Math.min(clampedIndex, maxSeconds);
    }
    
    if (clampedIndex !== selectedSeconds) {
      setSelectedSeconds(clampedIndex);
      if (onScroll) {
        onScroll();
      }
    }

    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    
    scrollTimerRef.current = setTimeout(() => {
      secondsScrollRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }, 100);
  };

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onConfirm(totalSeconds);
  };

  const renderPickerItems = (max: number, selectedValue: number, unit: string) => {
    const items = [];
    
    for (let i = 0; i < 2; i++) {
      items.push(
        <View key={`empty-top-${i}`} style={styles.pickerItem}>
          <Text style={styles.pickerItemText}> </Text>
        </View>
      );
    }
    
    for (let i = 0; i <= max; i++) {
      const isSelected = i === selectedValue;
      const distance = Math.abs(i - selectedValue);
      const opacity = Math.max(0.2, 1 - distance * 0.3);
      const scale = isSelected ? 1 : Math.max(0.85, 1 - distance * 0.08);

      items.push(
        <View
          key={i}
          style={[
            styles.pickerItem,
            isSelected && styles.pickerItemSelected,
          ]}
        >
          <Text
            style={[
              styles.pickerItemText,
              isSelected && styles.pickerItemTextSelected,
              { opacity, transform: [{ scale }] },
            ]}
          >
            {i.toString().padStart(2, '0')}
          </Text>
        </View>
      );
    }
    
    for (let i = 0; i < 2; i++) {
      items.push(
        <View key={`empty-bottom-${i}`} style={styles.pickerItem}>
          <Text style={styles.pickerItemText}> </Text>
        </View>
      );
    }
    
    return items;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />
        
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
              {renderPickerContent()}
            </BlurView>
          ) : (
            <View style={styles.solidContainer}>
              {renderPickerContent()}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  function renderPickerContent() {
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>設置 {mode} 點</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.pickersRow}>
          <View style={styles.pickerColumn}>
            <ScrollView
              ref={minutesScrollRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleMinutesScroll}
              scrollEventThrottle={16}
              bounces={false}
            >
              {renderPickerItems(maxMinutes, selectedMinutes, '分')}
            </ScrollView>
            <Text style={styles.unitLabel}>分</Text>
          </View>

          <View style={styles.separator}>
            <Text style={styles.separatorText}>:</Text>
          </View>

          <View style={styles.pickerColumn}>
            <ScrollView
              ref={secondsScrollRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleSecondsScroll}
              scrollEventThrottle={16}
              bounces={false}
            >
              {renderPickerItems(
                selectedMinutes === maxMinutes ? maxSeconds : 59,
                selectedSeconds,
                '秒'
              )}
            </ScrollView>
            <Text style={styles.unitLabel}>秒</Text>
          </View>
        </View>

        <View style={styles.selectionIndicator} pointerEvents="none">
          <View style={styles.selectionIndicatorTop} />
          <View style={styles.selectionIndicatorBottom} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>確認</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  solidContainer: {
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  pickerColumn: {
    alignItems: 'center',
    position: 'relative',
  },
  scrollView: {
    height: SCROLL_VIEW_HEIGHT,
    width: 80,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    // Selected item styling handled via text style
  },
  pickerItemText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
    fontVariant: ['tabular-nums'] as any,
  },
  pickerItemTextSelected: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  unitLabel: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -12,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  separator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  separatorText: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20 + 16 + ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    paddingHorizontal: 20,
  },
  selectionIndicatorTop: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectionIndicatorBottom: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
