import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '../theme';
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





// Navigation Types
type AuthStackParamList = {
    Login: undefined;
    Otp: { sessionId: string; phone: string };
};

type DriversStackParamList = {
    DriverList: undefined;
    DriverDetails: { driverId: string };
};

type DrawerParamList = {
    Dashboard: undefined;
    Drivers: undefined;
    Customers: undefined;
    Payouts: undefined;
    Promotions: undefined;
    Categories: undefined;
    Rides: undefined;
    Settings: undefined;
};

// Auth Stack Navigator
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Otp" component={OtpScreen} />
    </AuthStack.Navigator>
);

// Drivers Stack Navigator
const DriversStack = createNativeStackNavigator<DriversStackParamList>();

const DriversNavigator = () => (
    <DriversStack.Navigator screenOptions={{ headerShown: false }}>
        <DriversStack.Screen name="DriverList" component={DriverListScreen} />
        <DriversStack.Screen name="DriverDetails" component={DriverDetailsScreen} />
    </DriversStack.Navigator>
);

// Drawer Navigator
const Drawer = createDrawerNavigator<DrawerParamList>();

const CustomDrawerContent = (props: any) => {
    const { state, navigation } = props;
    const currentIndex = state.index;
    const { logout, user } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: '📊' },
        { name: 'Drivers', icon: '🚗' },
        { name: 'Customers', icon: '👥' },
        { name: 'Payouts', icon: '💰' },
        { name: 'Promotions', icon: '🎁' },
        { name: 'Categories', icon: '🏷️' },
        { name: 'Rides', icon: '🚕' },
        { name: 'Settings', icon: '⚙️' },
    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>F</Text>
                </View>
                <Text style={styles.drawerTitle}>Fikishwa Admin</Text>
                <Text style={styles.drawerSubtitle}>
                    {user?.phone ? `+${user.phone}` : 'Management Console'}
                </Text>
            </View>

            <View style={styles.drawerMenu}>
                {menuItems.map((item, index) => {
                    const isFocused = currentIndex === index;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.menuItem, isFocused && styles.menuItemActive]}
                            onPress={() => navigation.navigate(item.name)}
                        >
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <Text style={[styles.menuLabel, isFocused && styles.menuLabelActive]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.drawerFooter}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
                <Text style={styles.footerText}>v1.0.0</Text>
            </View>
        </View>
    );
};

const MainDrawer = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                drawerStyle: {
                    backgroundColor: Colors.surface,
                    width: 280,
                },
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="Drivers" component={DriversNavigator} />
            <Drawer.Screen name="Customers" component={CustomerListScreen} />
            <Drawer.Screen name="Payouts" component={PayoutScreen} />
            <Drawer.Screen name="Promotions" component={PromotionsScreen} />
            <Drawer.Screen name="Categories" component={CategoriesScreen} />
            <Drawer.Screen name="Rides" component={RidesScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
    );
};

// Loading Screen
const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
    </View>
);

// Root Navigator
const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    console.log(`AppNavigator: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`);

    if (isLoading) {
        console.log('AppNavigator: Rendering LoadingScreen');
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <>
                    {console.log('AppNavigator: Rendering MainDrawer')}
                    <MainDrawer />
                </>
            ) : (
                <>
                    {console.log('AppNavigator: Rendering AuthNavigator')}
                    <AuthNavigator />
                </>
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
    drawerContainer: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    drawerHeader: {
        padding: Spacing.lg,
        paddingTop: Spacing.xxl,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    logoText: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.bold,
        color: Colors.white,
    },
    drawerTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    drawerSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    drawerMenu: {
        flex: 1,
        paddingTop: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    menuItemActive: {
        backgroundColor: Colors.primary + '20',
    },
    menuIcon: {
        fontSize: FontSizes.xl,
        marginRight: Spacing.md,
    },
    menuLabel: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        fontWeight: FontWeights.medium,
    },
    menuLabelActive: {
        color: Colors.primary,
        fontWeight: FontWeights.semibold,
    },
    drawerFooter: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        alignItems: 'center',
    },
    logoutButton: {
        width: '100%',
        paddingVertical: Spacing.md,
        backgroundColor: Colors.error + '20',
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    logoutText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.error,
    },
    footerText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
});

export default AppNavigator;
