import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color="#FFC107" />
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFC107" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEditing ? 'Edit Job Vacancy' : 'Post a Job Vacancy'}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <LocationBanner />

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Job Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Need a reliable plumber"
                            placeholderTextColor="#666666"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Contact Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. you@example.com"
                            placeholderTextColor="#666666"
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
                            placeholderTextColor="#666666"
                            value={experience}
                            onChangeText={setExperience}
                        />

                        <Text style={styles.label}>Remuneration ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 150.00"
                            placeholderTextColor="#666666"
                            keyboardType="decimal-pad"
                            value={remuneration}
                            onChangeText={setRemuneration}
                        />

                        <Text style={styles.label}>Job Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the job in detail..."
                            placeholderTextColor="#666666"
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
                        {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Post Job'}</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333333' },
    backButton: { padding: 5 },
    title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FFC107' },
    scrollContent: { paddingBottom: 40 },
    formSection: { padding: 20, backgroundColor: '#1E1E1E', margin: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333333' },
    label: { fontSize: 14, fontWeight: '600', color: '#FFC107', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#333333', borderRadius: 16, padding: 12, fontSize: 16, color: '#FFFFFF' },
    textArea: { height: 100, textAlignVertical: 'top' },
    categoryScroll: { flexDirection: 'row', marginBottom: 10 },
    categoryChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#121212', borderWidth: 1, borderColor: '#333333', marginRight: 10 },
    categoryChipSelected: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
    categoryText: { color: '#A0A0A0', fontWeight: '500' },
    categoryTextSelected: { color: '#121212' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    skillChipItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#121212', borderWidth: 1, borderColor: '#333333' },
    skillChipItemSelected: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
    skillChipText: { color: '#A0A0A0', fontSize: 13, fontWeight: '500' },
    skillChipTextSelected: { color: '#121212', fontWeight: 'bold' },
    footer: { padding: 20, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#333333' },
    submitButton: { backgroundColor: '#FFC107', padding: 16, borderRadius: 30, alignItems: 'center' },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },
});
