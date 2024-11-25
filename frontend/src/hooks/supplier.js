// hooks/useSupplier.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  fetchSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '@/services/supplier';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

// Constants
const DEBOUNCE_DELAY = 300;

export const useSupplier = (initialPage = 1, initialLimit = 10, initialFormState = {
  name: '',
  email: '',
  phone: '',
  description: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  status: 'active',
  countryData: null,
  image: null
}) => {
  // 1. Define all state
  const [suppliers, setSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    total: 0
  });

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  // 2. Form validation
  const validateForm = useCallback((data) => {
    const errors = {};
    
    // Required fields
    if (!data.name?.trim()) errors.name = 'Name is required';
    if (!data.email?.trim()) errors.email = 'Email is required';
    if (!data.phone?.trim()) errors.phone = 'Phone is required';
    if (!data.street?.trim()) errors.street = 'Street address is required';
    if (!data.city?.trim()) errors.city = 'City is required';
    if (!data.state?.trim()) errors.state = 'State is required';
    if (!data.country?.trim()) errors.country = 'Country is required';
    if (!data.zipCode?.trim()) errors.zipCode = 'ZIP code is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email.trim())) {
      errors.email = 'Invalid email format';
    }

    // Phone validation
    const phoneRegex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    if (data.phone && !phoneRegex.test(data.phone.trim())) {
      errors.phone = 'Invalid phone number format';
    }

    // ZIP code validation
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (data.zipCode && !zipRegex.test(data.zipCode.trim())) {
      errors.zipCode = 'Invalid ZIP code format';
    }

    return errors;
  }, []);

  // 3. Base handlers
  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for the field being changed
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size and type
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG and WebP images are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  }, []);

  const handleImageDelete = useCallback(() => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: null
    }));
  }, []);

  // 4. Dependent handlers
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value); // Update search query immediately for UI
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setActiveFilters(prev => {
      if (key === null) return {}; // Clear all filters
      if (value === null) {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field, direction) => {
    setSortOrder(field);
    setSortDirection(direction);
  }, []);

  const handleEdit = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      description: supplier.description || '',
      street: supplier.street || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      zipCode: supplier.zipCode || '',
      status: supplier.status || 'active', // Properly map the status
      countryData: supplier.countryData || null,
      image: null
    });
    setImagePreview(supplier.image || null);
    setFormDialog(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setFormErrors({});
    setImagePreview(null);
  }, [initialFormState]);

  const handleCloseForm = useCallback(() => {
    setFormDialog(false);
    setSelectedSupplier(null);
    resetForm();
  }, [resetForm]);

  // 5. API handlers
  const getSuppliers = useCallback(async (abortSignal) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean up the params object
      const cleanParams = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortOrder,
        direction: sortDirection,
        ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        filters: activeFilters
      };

      // Log the request params
      console.log('Fetching suppliers with params:', cleanParams);

      const result = await fetchSuppliers(cleanParams);
      
      if (!abortSignal?.aborted) {
        // Check if we have data
        if (result.data) {
          setSuppliers(result.data);
          setTotalItems(result.total);
          setTotalPages(result.totalPages);
          
          // Update stats
          const activeCount = result.data.filter(s => s.active).length;
          setStats({
            active: activeCount,
            inactive: result.data.length - activeCount,
            total: result.total
          });
        } else {
          console.error('No data in response:', result);
          throw new Error('No data received from server');
        }
      }
    } catch (err) {
      if (!abortSignal?.aborted) {
        console.error('Error in getSuppliers:', err);
        setError(err.message || 'Failed to fetch suppliers');
        toast.error(err.message || 'Failed to fetch suppliers');
        // Set empty states on error
        setSuppliers([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [
    currentPage,
    itemsPerPage,
    sortOrder,
    sortDirection,
    debouncedSearchQuery,
    activeFilters
  ]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formDataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSubmit.append(key, value);
        }
      });

      if (selectedSupplier?._id) {
        await updateSupplier(selectedSupplier._id, formDataToSubmit);
        toast.success('Supplier updated successfully');
      } else {
        await createSupplier(formDataToSubmit);
        toast.success('Supplier created successfully');
      }

      await getSuppliers();
      handleCloseForm();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedSupplier, handleCloseForm, getSuppliers, validateForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedSupplier?._id) return;

    try {
      setSubmitting(true);
      await deleteSupplier(selectedSupplier._id);
      await getSuppliers();
      toast.success('Supplier deleted successfully');
      setDeleteDialog(false);
      setSelectedSupplier(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [selectedSupplier, getSuppliers]);

  const handleRefresh = useCallback(() => {
    getSuppliers();
  }, [getSuppliers]);

  const handleExport = useCallback(() => {
    // Implement export logic here
    toast.info('Export feature coming soon');
  }, []);

  // 6. Effects
  // Create debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchQuery);
        setCurrentPage(1); // Reset to first page on new search
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Fetch suppliers when dependencies change
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    getSuppliers(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [getSuppliers]);

  // 7. Return values and handlers
  return {
    // Data states
    suppliers,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    sortOrder,
    sortDirection,
    
    // UI states
    loading,
    error,
    formDialog,
    deleteDialog,
    selectedSupplier,
    searchQuery, // Return the immediate search query for UI
    activeFilters,
    formData,
    formErrors,
    submitting,
    imagePreview,
    stats,
    
    // Message states
    notification,
    
    // Setters
    setFormDialog,
    setDeleteDialog,
    setSelectedSupplier,
    setSearchQuery,
    setSortOrder,
    setSortDirection,
    setNotification,
    
    // Handlers
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleCloseForm,
    handlePageChange: setCurrentPage,
    handleLimitChange: setItemsPerPage,
    handleImageChange,
    handleImageDelete,
    handleSearchChange,
    handleFilterChange,
    handleSort,
    handleRefresh,
    handleExport,
    getSuppliers,
    validateForm,
    resetForm
  };
};

export default useSupplier;