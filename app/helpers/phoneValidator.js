export function phoneValidator(phone) {
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phone) return "Please fill in this field.";
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number (8-15 digits).';
    }
    return '';
  }