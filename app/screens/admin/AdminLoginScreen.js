import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import Background from "../../components/Background";
import Logo from "../../components/Logo";
import Header from "../../components/Header";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import BackButton from "../../components/BackButton";
import { theme } from "../../core/theme";
import { emailValidator } from "../../helpers/emailValidator";
import { passwordValidator } from "../../helpers/passwordValidator";
import { loginAsAdmin } from '../../../firebase/firebase';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const onLoginPressed = async () => {
    setGeneralError("");
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }
    
    setLoading(true);
    
    try { 
      const adminData = await loginAsAdmin(email.value, password.value);
      
      if (adminData) {
        setLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminDashboardScreen' }],
        });
      } else {
        setLoading(false);
        setGeneralError("This account doesn't have admin privileges.");
      }
    } catch (error) {
      setLoading(false);
      console.log("Admin login error:", error.code, error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setGeneralError("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        setGeneralError("Too many failed login attempts. Please try again later.");
      } else {
        setGeneralError("Login failed. Please check your connection and try again.");
      }
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <View style={styles.logoContainer}>
        <View style={styles.adminIconContainer}>
          <MaterialCommunityIcons name="shield-account" size={60} color={theme.colors.admin} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Header>Shop Owner Login</Header>
        <Text style={styles.subtitle}>Management portal access</Text>
      </View>
      
      {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}
      
      <TextInput
        label="Admin Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: "" })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />
      <TextInput
        label="Admin Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />
      
      <Button
        mode="contained"
        onPress={onLoginPressed}
        style={styles.loginButton}
        loading={loading}
        disabled={loading}
      >
        Access Admin Panel
      </Button>

      <View style={styles.alternativeLogins}>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate("LoginScreen")}
          style={styles.customerLink}
        >
          <MaterialCommunityIcons name="account" size={16} color={theme.colors.primary} />
          <Text style={styles.customerText}>Customer Login</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  adminIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.admin + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.admin,
    marginTop: 5,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    paddingHorizontal: 4,
    paddingVertical: 4,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: theme.colors.admin,
  },
  alternativeLogins: {
    marginTop: 30,
    alignItems: 'center',
  },

  customerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '10',
  },
  customerText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});