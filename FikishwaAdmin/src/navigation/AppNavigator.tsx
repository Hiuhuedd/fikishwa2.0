import React, { useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import DriverListScreen from '../screens/drivers/DriverListScreen';
import DriverDetailsScreen from '../screens/drivers/DriverDetailsScreen';
import CustomerListScreen from '../screens/customers/CustomerListScreen';
import PayoutScreen from '../screens/payouts/PayoutScreen';
import PromotionsScreen from '../screens/promotions/PromotionsScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import RidesScreen from '../screens/rides/RidesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const { width } = Dimensions.get('window');

// Navigation Types
type AuthStackParamList = {
    Login: undefined;
    Otp: { sessionId: string; phone: string };
};

type MainStackParamList = {
    Dashboard: undefined;
    Drivers: undefined;
    DriverDetails: { driverId: string };
    Customers: undefined;
    Payouts: undefined;
    Promotions: undefined;
    Categories: undefined;
    Rides: undefined;
    Settings: undefined;
};

// Auth Navigator
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Otp" component={OtpScreen} />
    </AuthStack.Navigator>
);

// Custom Sidebar Component
const CustomSidebar = ({ visible, onNavigate, onClose, user, onLogout }: any) => {
    if (!visible) return null;

    const menuItems = [
        { name: 'Dashboard', icon: '📊', route: 'Dashboard' },
        { name: 'Drivers', icon: '🚗', route: 'Drivers' },
        { name: 'Customers', icon: '👥', route: 'Customers' },
        { name: 'Payouts', icon: '💰', route: 'Payouts' },
        { name: 'Promotions', icon: '🎁', route: 'Promotions' },
        { name: 'Categories', icon: '🏷️', route: 'Categories' },
        { name: 'Rides', icon: '🚕', route: 'Rides' },
        { name: 'Settings', icon: '⚙️', route: 'Settings' },
    ];

    return (
        <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            />
            <View style={styles.sidebar}>
                <SafeAreaView style={styles.sidebarInner}>
                    <View style={styles.sidebarHeader}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>F</Text>
                        </View>
                        <View>
                            <Text style={styles.sidebarTitle}>Fikishwa Admin</Text>
                            <Text style={styles.sidebarSubtitle}>{user?.phone ? `+${user.phone}` : 'Console'}</Text>
                        </View>
                    </View>

                    <View style={styles.sidebarMenu}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                style={styles.menuItem}
                                onPress={() => {
                                    onNavigate(item.route);
                                    onClose();
                                }}
                            >
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={styles.menuLabel}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.sidebarFooter}>
                        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                            <Text style={styles.logoutText}>🚪 Logout</Text>
                        </TouchableOpacity>
                        <Text style={styles.versionText}>v1.0.0</Text>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
};

// Main Stack Navigator
const MainStack = createNativeStackNavigator<MainStackParamList>();

const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const navigationRef = useNavigationContainerRef();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? (
                <View style={{ flex: 1 }}>
                    <MainStack.Navigator
                        screenOptions={({ navigation }) => ({
                            headerStyle: { backgroundColor: Colors.surface, borderBottomWidth: 0 },
                            headerTintColor: Colors.textPrimary,
                            headerTitleStyle: { fontWeight: FontWeights.bold },
                            headerLeft: () => (
                                <TouchableOpacity
                                    style={{ marginLeft: Spacing.md, padding: 8 }}
                                    onPress={() => setSidebarVisible(true)}
                                >
                                    <Text style={{ fontSize: 24, color: Colors.textPrimary }}>☰</Text>
                                </TouchableOpacity>
                            ),
                        })}
                    >
                        <MainStack.Screen name="Dashboard" component={DashboardScreen} />
                        <MainStack.Screen name="Drivers" component={DriverListScreen} />
                        <MainStack.Screen name="DriverDetails" component={DriverDetailsScreen} />
                        <MainStack.Screen name="Customers" component={CustomerListScreen} />
                        <MainStack.Screen name="Payouts" component={PayoutScreen} />
                        <MainStack.Screen name="Promotions" component={PromotionsScreen} />
                        <MainStack.Screen name="Categories" component={CategoriesScreen} />
                        <MainStack.Screen name="Rides" component={RidesScreen} />
                        <MainStack.Screen name="Settings" component={SettingsScreen} />
                    </MainStack.Navigator>

                    <CustomSidebar
                        visible={sidebarVisible}
                        user={user}
                        onClose={() => setSidebarVisible(false)}
                        onLogout={logout}
                        onNavigate={(route: any) => {
                            if (navigationRef.isReady()) {
                                navigationRef.navigate(route as never);
                            }
                        }}
                    />
                </View>
            ) : (
                <AuthNavigator />
            )}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
    },
    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.8,
        maxWidth: 300,
        backgroundColor: Colors.surface,
        zIndex: 1001,
        ...Shadows.lg,
    },
    sidebarInner: {
        flex: 1,
    },
    sidebarHeader: {
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
        backgroundColor: Colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.white,
    },
    sidebarTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    sidebarSubtitle: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
    },
    sidebarMenu: {
        flex: 1,
        padding: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xs,
    },
    menuIcon: {
        fontSize: FontSizes.xl,
        marginRight: Spacing.md,
    },
    menuLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: FontWeights.medium,
    },
    sidebarFooter: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    logoutButton: {
        padding: Spacing.md,
        backgroundColor: Colors.error + '15',
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    logoutText: {
        color: Colors.error,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: FontSizes.xs,
        marginTop: Spacing.sm,
    }
});

export default AppNavigator;
