import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, RadioButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { addVehicle } from "../../firebase/firebase";

const vehicleTypes = [
  { value: 'sedan', label: 'Sedan', icon: 'car-hatchback' },
  { value: 'hatchback', label: 'Hatchback', icon: 'car-hatchback' },
  { value: 'suv', label: 'SUV', icon: 'car-estate' },
  { value: 'mpv', label: 'MPV', icon: 'car-estate' }
];

export default function AddVehicleScreen({ navigation }) {
  const [plateNumber, setPlateNumber] = useState({ value: "", error: "" });
  const [vehicleType, setVehicleType] = useState('sedan');
  const [brand, setBrand] = useState({ value: "", error: "" });
  const [model, setModel] = useState({ value: "", error: "" });
  const [color, setColor] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);

  const validatePlateNumber = (plate) => {
    if (!plate) return "License plate is required.";
    return '';
  };

  const onSubmit = async () => {
    const plateNumberError = validatePlateNumber(plateNumber.value);
    
    if (plateNumberError) {
      setPlateNumber({ ...plateNumber, error: plateNumberError });
      return;
    }

    setLoading(true);
    
    try {
      await addVehicle({
        plateNumber: plateNumber.value.toUpperCase(),
        type: vehicleType,
        brand: brand.value,
        model: model.value,
        color: color.value
      });
      
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error("Error adding vehicle:", error);
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Add New Vehicle</Header>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          label="License Plate"
          returnKeyType="next"
          value={plateNumber.value}
          onChangeText={(text) => setPlateNumber({ value: text, error: "" })}
          error={!!plateNumber.error}
          errorText={plateNumber.error}
          autoCapitalize="characters"
          style={styles.input}
        />
        
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.vehicleTypesContainer}>
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.vehicleTypeOption,
                vehicleType === type.value && styles.selectedVehicleType
              ]}
              onPress={() => setVehicleType(type.value)}
            >
              <MaterialCommunityIcons 
                name={type.icon} 
                size={32} 
                color={vehicleType === type.value ? theme.colors.primary : theme.colors.text} 
              />
              <Text 
                style={[
                  styles.vehicleTypeText,
                  vehicleType === type.value && styles.selectedVehicleTypeText
                ]}
              >
                {type.label}
              </Text>
              <RadioButton
                value={type.value}
                status={vehicleType === type.value ? 'checked' : 'unchecked'}
                onPress={() => setVehicleType(type.value)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
        
        <TextInput
          label="Brand (Optional)"
          returnKeyType="next"
          value={brand.value}
          onChangeText={(text) => setBrand({ value: text, error: "" })}
          error={!!brand.error}
          errorText={brand.error}
          style={styles.input}
        />
        
        <TextInput
          label="Model (Optional)"
          returnKeyType="next"
          value={model.value}
          onChangeText={(text) => setModel({ value: text, error: "" })}
          error={!!model.error}
          errorText={model.error}
          style={styles.input}
        />
        
        <TextInput
          label="Color (Optional)"
          returnKeyType="done"
          value={color.value}
          onChangeText={(text) => setColor({ value: text, error: "" })}
          error={!!color.error}
          errorText={color.error}
          style={styles.input}
        />
        
        <Button
          mode="contained"
          onPress={onSubmit}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Add Vehicle
        </Button>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 5,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  vehicleTypesContainer: {
    marginBottom: 20,
  },
  vehicleTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedVehicleType: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f4ff',
  },
  vehicleTypeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedVehicleTypeText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
  },
});