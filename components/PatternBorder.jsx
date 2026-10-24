import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// Dải hoa văn: hai đường kẻ vàng, ở giữa là hàng hình thoi đặc và rỗng xen kẽ
export default function PatternBorder({ color = colors.gold, style }) {
  const items = [];

  for (let i = 0; i < 30; i++) {
    items.push(
      <View
        key={i}
        style={[styles.diamond, { borderColor: color }, i % 2 === 0 && { backgroundColor: color }]}
      />
    );
  }

  return (
    <View style={style}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={styles.row}>{items}</View>
      <View style={[styles.line, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 1.5 },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 7,
  },
  diamond: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    marginHorizontal: 5,
    transform: [{ rotate: '45deg' }],
  },
});
