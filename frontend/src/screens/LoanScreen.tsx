import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type LoanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loan'>;

interface LoanItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  monthlyPayment: number;
  progress: number;
  estimatedInterest: number;
}

const SAMPLE_LOANS: LoanItem[] = [
  {
    id: '1',
    title: 'Pay Off Debt',
    amount: 2400,
    dueDate: 'June 2023',
    monthlyPayment: 1000,
    progress: 20,
    estimatedInterest: 1200,
  },
  {
    id: '2',
    title: 'Car Loan',
    amount: 15000,
    dueDate: 'December 2024',
    monthlyPayment: 800,
    progress: 45,
    estimatedInterest: 2500,
  },
];

const LoanScreen = () => {
  const navigation = useNavigation<LoanScreenNavigationProp>();

  const renderLoanItem = (item: LoanItem) => (
    <View key={item.id} style={styles.loanItem}>
      <View style={styles.loanHeader}>
        <View style={styles.loanIcon}>
          <Ionicons name="cash-outline" size={24} color="#1F41BB" />
        </View>
        <View style={styles.loanInfo}>
          <Text style={styles.loanTitle}>{item.title}</Text>
          <Text style={styles.amountText}>
            ${item.amount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Your estimated interest</Text>
            <Text style={styles.detailValue}>You could save ${item.estimatedInterest}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="trending-up-outline" size={24} color="#1F41BB" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pay off by</Text>
            <Text style={styles.detailValue}>{item.dueDate}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="calendar-outline" size={24} color="#1F41BB" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Monthly payment</Text>
            <Text style={styles.detailValue}>${item.monthlyPayment.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Monitor your progress</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${item.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{item.progress}% paid</Text>
        </View>
      </View>
    </View>
  );

  const handleAddLoan = () => {
    // Navigate to create loan screen
    // navigation.navigate('CreateLoan');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Loans</Text>
            <Text style={styles.headerSubtitle}>Track your loans</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          {SAMPLE_LOANS.map(renderLoanItem)}

          <View style={styles.createSection}>
            <Text style={styles.createTitle}>Need a new loan?</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleAddLoan}>
              <Text style={styles.createButtonText}>Apply for a loan</Text>
              <View style={styles.addIconContainer}>
                <Ionicons name="add" size={24} color="#1F41BB" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <FloatingActionButton onPress={handleAddLoan} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F41BB',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loanItem: {
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F41BB',
  },
  loanDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1F41BB',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
  },
  createSection: {
    marginTop: 24,
    marginBottom: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  createButtonText: {
    fontSize: 16,
    color: '#1F41BB',
    fontWeight: '500',
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoanScreen; 