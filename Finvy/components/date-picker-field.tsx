import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Theme, Fonts } from '@/constants/theme';

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  helperText?: string;
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function DatePickerField({ label, value, onChange, helperText }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const dateValue = new Date(value || new Date());

  const formatDisplay = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {helperText && <Text style={styles.helper}>{helperText}</Text>}
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={18} color={Theme.accent} />
        <Text style={styles.dateText}>{formatDisplay(dateValue)}</Text>
        <Ionicons name="chevron-down" size={14} color={Theme.textMuted} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant="dark"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShow(false);
            if (selected) onChange(toISO(selected));
          }}
          style={styles.picker}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => setShow(false)}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface DayPickerFieldProps {
  label: string;
  value: string; // day as string "1"-"31"
  onChange: (day: string) => void;
  helperText?: string;
}

export function DayPickerField({ label, value, onChange, helperText }: DayPickerFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const currentDay = parseInt(value) || 1;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {helperText && <Text style={styles.helper}>{helperText}</Text>}
      <TouchableOpacity style={styles.field} onPress={() => setExpanded(!expanded)}>
        <Ionicons name="calendar-outline" size={18} color={Theme.accent} />
        <Text style={styles.dateText}>Day {currentDay}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Theme.textMuted} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.dayGrid}>
          {days.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayCell, d === currentDay && styles.dayCellActive]}
              onPress={() => { onChange(d.toString()); setExpanded(false); }}
            >
              <Text style={[styles.dayText, d === currentDay && styles.dayTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textMuted,
    marginBottom: 4,
    marginTop: 16,
  },
  helper: {
    fontSize: 11,
    color: Theme.textMuted,
    marginBottom: 6,
    lineHeight: 16,
    opacity: 0.7,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.inputBg,
    borderWidth: 1,
    borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Theme.textPrimary,
    fontFamily: Fonts?.mono,
  },
  picker: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.accent,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    backgroundColor: Theme.cardBg,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: 14,
    padding: 12,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.inputBg,
  },
  dayCellActive: {
    backgroundColor: Theme.accent,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.textBody,
  },
  dayTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
});
