import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { splitVideo, type SplitJob } from '../src/native/videoEngine';

const DURATION_PRESETS = [15, 30, 60, 90, 120];

export default function HomeScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsPerClip, setSecondsPerClip] = useState(60);

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
      // Avoid eagerly copying a 1 GB source into app cache. Native processing reads the selected URI directly.
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUri(asset.uri);
    setName(asset.name ?? 'Video');
    setDuration(asset.duration ? asset.duration / 1000 : null);
  }

  async function startSplit() {
    if (!uri) return;
    const job: SplitJob = {
      inputUri: uri,
      mode: 'duration',
      secondsPerClip,
      crop: { type: 'original' },
      preserveAudio: true,
    };
    setBusy(true);
    try {
      const result = await splitVideo(job);
      Alert.alert('Export complete', `${result.outputs.length} clip(s) created.`);
    } catch (error) {
      Alert.alert('Processing error', error instanceof Error ? error.message : 'Native video processing failed.');
    } finally {
      setBusy(false);
    }
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
          <VideoView
            player={player}
            style={styles.preview}
            nativeControls
            contentFit="contain"
          />
          <Text style={styles.meta}>{durationLabel}</Text>

          <Text style={styles.sectionTitle}>Split every</Text>
          <View style={styles.pills}>
            {DURATION_PRESETS.map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => setSecondsPerClip(seconds)}
                style={[styles.pill, secondsPerClip === seconds && styles.pillActive]}
              >
                <Text style={[styles.pillText, secondsPerClip === seconds && styles.pillTextActive]}>{seconds}s</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.secondary, busy && styles.disabled]} disabled={busy} onPress={startSplit}>
            <Text style={styles.secondaryText}>{busy ? 'Processing…' : `Split into ${secondsPerClip}s clips`}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.modes}>
        <Text style={styles.sectionTitle}>SplitVideo V1</Text>
        <Text style={styles.item}>• Duration: 15 / 30 / 60 / 90 / 120 / Custom</Text>
        <Text style={styles.item}>• Equal parts: 2 / 4 / 6 / 10 / Custom</Text>
        <Text style={styles.item}>• Crop: Original / 9:16 / 1:1 / Custom</Text>
        <Text style={styles.item}>• Preview, audio preservation, export, save and share</Text>
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
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderColor: '#393940', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  pillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  pillText: { color: '#aaaab2', fontWeight: '700' },
  pillTextActive: { color: '#111' },
  secondary: { borderWidth: 1, borderColor: '#393940', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  modes: { marginTop: 28 },
  item: { color: '#9d9da6', marginBottom: 8, fontSize: 14 },
});
