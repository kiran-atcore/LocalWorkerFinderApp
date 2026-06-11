import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { ErrorText } from './ErrorText';

interface Props<T extends FieldValues> extends Omit<TextInputProps, 'name'> {
  control: Control<T, any>;
  name: Path<T>;
  label?: string;
}

export function ControlledInput<T extends FieldValues>({ control, name, label, ...props }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <TextInput 
            style={[styles.input, error && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor="#999"
            {...props} 
          />
          <ErrorText message={error?.message} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, marginBottom: 12 },
  label: { fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 },
});