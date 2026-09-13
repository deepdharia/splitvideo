import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { splitVideo, type CropMode, type SplitJob } from '../src/native/videoEngine';

const MAX_FILE_BYTES = 1024 * 1024 * 1024;
const DURATION_PRESETS = [15, 30, 60, 90, 120];
const PART_PRESETS = [2, 4, 6, 10];
const CROP_PRESETS: CropMode[] = [{ type: 'original' }, { type: '9:16' }, { type: '1:1' }];

export default function HomeScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'duration' | 'parts'>('duration');
  const [secondsPerClip, setSecondsPerClip] = useState(60);
  const [parts, setParts] = useState(4);
  const [customValue, setCustomValue] = useState('');
  const [crop, setCrop] = useState<CropMode>({ type: 'original' });
  const [outputs, setOutputs] = useState<string[]>([]);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  const durationLabel = useMemo(() => {
    if (!duration) return 'Reading video…';
    return `${Math.round(duration)} sec`;
  }, [duration]);

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_BYTES) {
      Alert.alert('Video too large', 'SplitVideo V1 supports videos up to 1 GB.');
      return;
    }
    setUri(asset.uri);
    setName(asset.name ?? 'Video');
    setDuration(asset.duration ? asset.duration / 1000 : null);
    setOutputs([]);
  }

  function getJob(): SplitJob {
    if (!uri) throw new Error('Choose a video first.');
    if (mode === 'duration') {
      const seconds = customValue.trim() ? Number(customValue) : secondsPerClip;
      if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Enter a valid clip duration.');
      return { inputUri: uri, mode, secondsPerClip: seconds, crop, preserveAudio: true };
    }
    const count = customValue.trim() ? Number(customValue) : parts;
    if (!Number.isInteger(count) || count < 2 || count > 100) throw new Error('Parts must be a whole number from 2 to 100.');
    return { inputUri: uri, mode, parts: count, crop, preserveAudio: true };
  }

  async function startSplit() {
    setBusy(true);
    try {
      const result = await splitVideo(getJob());
      setOutputs(result.outputs);
      Alert.alert('Export complete', `${result.outputs.length} clip(s) created on your device.`);
    } catch (error) {
      Alert.alert('Processing error', error instanceof Error ? error.message : 'Native video processing failed.');
    } finally {
      setBusy(false);
    }
  }

  async function saveOutput(uriToSave: string) {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow Photos access to save exported videos.');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uriToSave);
    Alert.alert('Saved', 'The clip was saved to your photo library.');
  }

  async function shareOutput(uriToShare: string) {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing unavailable', 'This device cannot share local video files right now.');
      return;
    }
    await Sharing.shareAsync(uriToShare, { mimeType: 'video/mp4', dialogTitle: 'Share SplitVideo clip' });
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.eyebrow}>SPLITVIDEO</Text>
      <Text style={styles.title}>Split videos without the complicated stuff.</Text>
      <Text style={styles.subtitle}>Local-first video splitting, cropping and export. Your source video stays on your device.</Text>

      <Pressable style={styles.primary} onPress={pickVideo}>
        <Text style={styles.primaryText}>{uri ? 'Choose another video' : 'Choose video'}</Text>
      </Pressable>

      {uri && (
        <View style={styles.card}>
          <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
          <VideoView player={player} style={styles.preview} nativeControls contentFit="contain" />
          <Text style={styles.meta}>{durationLabel}</Text>

          <View style={styles.segmented}>
            {(['duration', 'parts'] as const).map((value) => (
              <Pressable key={value} onPress={() => { setMode(value); setCustomValue(''); }} style={[styles.segment, mode === value && styles.segmentActive]}>
                <Text style={[styles.segmentText, mode === value && styles.segmentTextActive]}>{value === 'duration' ? 'By duration' : 'Equal parts'}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{mode === 'duration' ? 'Split every' : 'Number of parts'}</Text>
          <View style={styles.pills}>
            {(mode === 'duration' ? DURATION_PRESETS : PART_PRESETS).map((value) => {
              const selected = mode === 'duration' ? secondsPerClip === value && !customValue : parts === value && !customValue;
              return (
                <Pressable key={value} onPress={() => { mode === 'duration' ? setSecondsPerClip(value) : setParts(value); setCustomValue(''); }} style={[styles.pill, selected && styles.pillActive]}>
                  <Text style={[styles.pillText, selected && styles.pillTextActive]}>{mode === 'duration' ? `${value}s` : value}</Text>
                </Pressable>
              );
            })}
            <TextInput
              value={customValue}
              onChangeText={setCustomValue}
              keyboardType="numeric"
              placeholder={mode === 'duration' ? 'Custom seconds' : 'Custom parts'}
              placeholderTextColor="#777780"
              style={styles.customInput}
            />
          </View>

          <Text style={styles.sectionTitle}>Crop</Text>
          <View style={styles.pills}>
            {CROP_PRESETS.map((value) => (
              <Pressable key={value.type} onPress={() => setCrop(value)} style={[styles.pill, crop.type === value.type && styles.pillActive]}>
                <Text style={[styles.pillText, crop.type === value.type && styles.pillTextActive]}>{value.type === 'original' ? 'Original' : value.type}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.secondary, busy && styles.disabled]} disabled={busy} onPress={startSplit}>
            <Text style={styles.secondaryText}>{busy ? 'Processing on device…' : 'Export clips'}</Text>
          </Pressable>
        </View>
      )}

      {outputs.length > 0 && (
        <View style={styles.outputs}>
          <Text style={styles.sectionTitle}>Exported clips</Text>
          {outputs.map((output, index) => (
            <View key={output} style={styles.outputRow}>
              <Text style={styles.outputName} numberOfLines={1}>Clip {index + 1}</Text>
              <View style={styles.outputActions}>
                <Pressable onPress={() => saveOutput(output)} style={styles.smallButton}><Text style={styles.smallButtonText}>Save</Text></Pressable>
                <Pressable onPress={() => shareOutput(output)} style={styles.smallButton}><Text style={styles.smallButtonText}>Share</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.modes}>
        <Text style={styles.sectionTitle}>SplitVideo V1</Text>
        <Text style={styles.item}>• Up to 1 GB target, with device/storage limits enforced safely</Text>
        <Text style={styles.item}>• Local processing — no source upload</Text>
        <Text style={styles.item}>• Android Media3 + iOS AVFoundation native engines</Text>
        <Text style={styles.item}>• Captions, AI tools and smart clipping come in later phases</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: '#0b0b0d', padding: 24, paddingTop: 72, paddingBottom: 48 },
  eyebrow: { color: '#8b8b93', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '800', marginTop: 10 },
  subtitle: { color: '#a7a7b0', fontSize: 16, lineHeight: 23, marginTop: 12, marginBottom: 24 },
  primary: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#111', fontSize: 16, fontWeight: '800' },
  card: { marginTop: 20, backgroundColor: '#151519', borderRadius: 20, padding: 14 },
  fileName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  preview: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12 },
  meta: { color: '#9999a3', marginVertical: 10 },
  segmented: { flexDirection: 'row', backgroundColor: '#0d0d10', borderRadius: 12, padding: 4, marginBottom: 18 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { color: '#888891', fontWeight: '700' },
  segmentTextActive: { color: '#111' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  pill: { borderWidth: 1, borderColor: '#393940', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  pillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  pillText: { color: '#aaaab2', fontWeight: '700' },
  pillTextActive: { color: '#111' },
  customInput: { minWidth: 115, borderWidth: 1, borderColor: '#393940', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, color: '#fff' },
  secondary: { borderWidth: 1, borderColor: '#393940', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  outputs: { marginTop: 28, backgroundColor: '#151519', borderRadius: 20, padding: 14 },
  outputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#29292f' },
  outputName: { color: '#fff', flex: 1, fontWeight: '700' },
  outputActions: { flexDirection: 'row', gap: 8 },
  smallButton: { borderWidth: 1, borderColor: '#393940', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  smallButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modes: { marginTop: 28 },
  item: { color: '#9d9da6', marginBottom: 8, fontSize: 14 },
});
