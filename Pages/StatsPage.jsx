import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCategoryTotals, getMonthSummary } from '../db';
import { formatMoney, formatMonth, getMonthKey, getPercent, shiftMonth } from '../utils';

import { colors, fonts } from '../theme';

// Chiều cao tối đa của cột trong biểu đồ
const CHART_HEIGHT = 100;

// Chiều cao cột tỉ lệ với giá trị lớn nhất, có tiền thì cột thấp nhất cũng nhìn thấy được
function getBarHeight(value, maxValue) {
  if (value <= 0) return 0;

  return Math.max(3, Math.round((value / maxValue) * CHART_HEIGHT));
}

// Danh sách tổng tiền theo từng danh mục, mỗi dòng có thanh tỷ lệ so với tổng
function CategoryBars({ title, list, color }) {
  const total = list.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {list.length === 0 && <Text style={styles.empty}>Tháng này chưa có dữ liệu</Text>}

      {list.map((item, index) => {
        const percent = getPercent(item.total, total);

        return (
          <View key={index} style={styles.barItem}>
            <View style={styles.barTop}>
              <Text style={styles.barName}>{item.category_name ?? 'Không rõ'}</Text>
              <Text style={styles.barValue}>
                {formatMoney(item.total)}đ · {percent}%
              </Text>
            </View>

            <View style={styles.barBack}>
              <View style={[styles.barFill, { width: percent + '%', backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function StatsPage() {
  const [month, setMonth] = useState(getMonthKey(new Date()));
  const [summary, setSummary] = useState({ thu: 0, chi: 0 });
  const [chiList, setChiList] = useState([]);
  const [thuList, setThuList] = useState([]);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStats = async () => {
    try {
      setErrorMessage('');

      const monthSummary = await getMonthSummary(month);
      const chi = await getCategoryTotals(month, 'chi');
      const thu = await getCategoryTotals(month, 'thu');

      // 6 tháng gần nhất, tính đến tháng đang xem
      const recent = [];

      for (let i = 5; i >= 0; i--) {
        const key = shiftMonth(month, -i);
        const s = await getMonthSummary(key);

        recent.push({ key: key, thu: s.thu, chi: s.chi });
      }

      setSummary(monthSummary);
      setChiList(chi);
      setThuList(thu);
      setHistory(recent);
    } catch (error) {
      setErrorMessage('Không đọc được thống kê: ' + error.message);
    }
  };

  // Đổi tháng thì tải lại thống kê của tháng đó
  useEffect(() => {
    loadStats();
  }, [month]);

  const diff = summary.thu - summary.chi;

  // Giá trị lớn nhất trong 6 tháng, dùng để chia tỉ lệ chiều cao cột
  let maxValue = 1;

  for (let i = 0; i < history.length; i++) {
    if (history[i].thu > maxValue) maxValue = history[i].thu;
    if (history[i].chi > maxValue) maxValue = history[i].chi;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.monthRow}>
        <Pressable style={styles.monthButton} onPress={() => setMonth(shiftMonth(month, -1))}>
          <Text style={styles.monthButtonText}>{'<'}</Text>
        </Pressable>

        <Text style={styles.monthText}>Tháng {formatMonth(month)}</Text>

        <Pressable style={styles.monthButton} onPress={() => setMonth(shiftMonth(month, 1))}>
          <Text style={styles.monthButtonText}>{'>'}</Text>
        </Pressable>
      </View>

      {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.summaryCard}>
        <Text style={styles.diffLabel}>Chênh lệch thu - chi</Text>
        <Text style={styles.diffValue}>
          {diff > 0 ? '+' : ''}
          {formatMoney(diff)}đ
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryValue, styles.thu]}>{formatMoney(summary.thu)}đ</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={[styles.summaryValue, styles.chi]}>{formatMoney(summary.chi)}đ</Text>
          </View>
        </View>
      </View>

      <CategoryBars title="Chi tiêu theo danh mục" list={chiList} color={colors.chi} />
      <CategoryBars title="Thu nhập theo danh mục" list={thuList} color={colors.thu} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6 tháng gần nhất</Text>

        <View style={styles.chart}>
          {history.map((item) => (
            <View key={item.key} style={styles.chartCol}>
              <View style={styles.chartBars}>
                <View
                  style={[
                    styles.chartBar,
                    { height: getBarHeight(item.thu, maxValue), backgroundColor: colors.thu },
                  ]}
                />
                <View
                  style={[
                    styles.chartBar,
                    { height: getBarHeight(item.chi, maxValue), backgroundColor: colors.chi },
                  ]}
                />
              </View>

              <Text style={[styles.chartLabel, item.key === month && styles.chartLabelActive]}>
                T{parseInt(item.key.split('-')[1], 10)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.thu }]} />
          <Text style={styles.legendText}>Thu</Text>

          <View style={[styles.legendDot, { backgroundColor: colors.chi }]} />
          <Text style={styles.legendText}>Chi</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 12, paddingBottom: 30 },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  monthText: { fontFamily: fonts.heading, fontSize: 17, fontWeight: 'bold', color: colors.ink },

  error: { color: colors.chi, textAlign: 'center', marginBottom: 12 },

  summaryCard: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  diffLabel: { color: colors.goldSoft, fontSize: 14 },
  diffValue: {
    fontFamily: fonts.heading,
    color: colors.cream,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: { color: colors.inkSoft, fontSize: 13 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  thu: { color: colors.thu },
  chi: { color: colors.chi },

  section: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 10,
  },
  empty: { color: colors.inkMute },

  barItem: { marginBottom: 12 },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barName: { color: colors.ink, fontSize: 14 },
  barValue: { color: colors.inkSoft, fontSize: 13 },
  barBack: { height: 10, borderRadius: 5, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },

  chart: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 3,
  },
  chartBar: { width: 12, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { color: colors.inkMute, fontSize: 12, marginTop: 6 },
  chartLabelActive: { color: colors.primary, fontWeight: 'bold' },

  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { color: colors.inkSoft, fontSize: 13, marginRight: 14 },
});