// src/admin/product/supplier/utils/constants.js

export const countries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'China', code: 'CN', flag: '🇨🇳' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
    { name: 'Spain', code: 'ES', flag: '🇪🇸' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹' },
    { name: 'Russia', code: 'RU', flag: '🇷🇺' },
    { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  ];
  
  export const initialFormState = {
    name: '',
    email: '',
    phone: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    image: null
  };
  
  export const TABLE_HEADERS = [
    { id: 'details', label: 'Company Details' },
    { id: 'contact', label: 'Contact Information' },
    { id: 'actions', label: 'Actions', align: 'right' }
  ];
  
  export const IMAGE_CONFIG = {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif'],
    dimensions: {
      width: 300,
      height: 300
    }
  };
  
  export const FORM_SECTIONS = {
    basic: {
      title: 'Basic Information',
      fields: ['name', 'email', 'phone', 'description']
    },
    address: {
      title: 'Address Information',
      fields: ['street', 'city', 'state', 'country', 'zipCode']
    }
  };