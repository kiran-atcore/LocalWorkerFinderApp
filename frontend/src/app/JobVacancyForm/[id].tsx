import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import LocationBanner from '../../Components/LocationBanner';
import { CATEGORIES } from '../../constants/categories';

export default function JobVacancyFormDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { searchLocation, user } = useAuthStore();

    const isEditing = id && id !== 'new';

    const [title, setTitle] = useState('');
    const [contactEmail, setContactEmail] = useState(user?.email || '');
    const [skills, setSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState('');
    const [remuneration, setRemuneration] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            const fetchVacancy = async () => {
                try {
                    setInitialLoading(true);
                    const res = await api.get(`bookings/vacancies/${id}/`);
                    const data = res.data;
                    setTitle(data.title || '');
                    setSkills(data.skills_required || []);
                    setExperience(data.experience_required);
                    setContactEmail(data.contact_email || '');
                    setRemuneration(data.remuneration.toString());
                    setDescription(data.description);
                } catch (err) {
                    Alert.alert('Error', 'Failed to fetch job vacancy.');
                    router.back();
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchVacancy();
        }
    }, [id]);

    const handleSubmit = async () => {
        if (!title.trim() || skills.length === 0 || !experience || !remuneration || !description) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }

        if (!isEditing && !searchLocation) {
            Alert.alert('Location Required', 'Please wait for your location to be detected.');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                title,
                category: skills.length > 0 ? skills[0] : 'General',
                contact_email: contactEmail,
                skills_required: skills,
                experience_required: experience,
                remuneration: parseFloat(remuneration),
                description,
            };

            if (searchLocation) {
                payload.latitude = searchLocation.latitude;
                payload.longitude = searchLocation.longitude;
                payload.address_text = searchLocation.address_text;
            }

            if (isEditing) {
                await api.patch(`bookings/vacancies/${id}/`, payload);
                Alert.alert('Success', 'Job vacancy updated successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                await api.post('bookings/vacancies/', payload);
                Alert.alert('Success', 'Job vacancy posted successfully!', [
                    { text: 'OK', onPress: () => router.replace('/JobVacancy/list') }
                ]);
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to save job vacancy.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEditing ? 'Edit Job Vacancy' : 'Post a Job Vacancy'}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <LocationBanner />

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Job Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Need a reliable plumber"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Contact Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={contactEmail}
                            onChangeText={setContactEmail}
                        />

                        <Text style={styles.label}>Required Skills</Text>
                        <View style={styles.skillsContainer}>
                            {CATEGORIES.map(cat => {
                                const isSelected = skills.includes(cat.name);
                                return (
                                    <TouchableOpacity
                                        key={`skill-${cat.id}`}
                                        style={[styles.skillChipItem, isSelected && styles.skillChipItemSelected]}
                                        onPress={() => {
                                            if (isSelected) {
                                                setSkills(skills.filter(s => s !== cat.name));
                                            } else {
                                                setSkills([...skills, cat.name]);
                                            }
                                        }}
                                    >
                                        <Text style={[styles.skillChipText, isSelected && styles.skillChipTextSelected]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>Experience Required</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2-5 years"
                            value={experience}
                            onChangeText={setExperience}
                        />

                        <Text style={styles.label}>Remuneration ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 150.00"
                            keyboardType="decimal-pad"
                            value={remuneration}
                            onChangeText={setRemuneration}
                        />

                        <Text style={styles.label}>Job Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the job in detail..."
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Post Job'}</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    backButtonText: { fontSize: 16, color: '#007AFF' },
    title: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 40 },
    formSection: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    categoryScroll: { flexDirection: 'row', marginBottom: 10 },
    categoryChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
    categoryChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    categoryText: { color: '#666', fontWeight: '500' },
    categoryTextSelected: { color: '#fff' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    skillChipItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
    skillChipItemSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    skillChipText: { color: '#666', fontSize: 13, fontWeight: '500' },
    skillChipTextSelected: { color: '#fff' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    submitButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
