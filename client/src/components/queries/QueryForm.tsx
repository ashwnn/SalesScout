import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import '@/styles/query.css';

const QueryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const { createQuery, updateQuery, getQuery, currentQuery, clearCurrentQuery } = useContext(QueryContext);

  const [formData, setFormData] = useState({
    name: '',
    keywordsText: '',
    categoriesText: '',
    intervalMinutes: '60',
    webhookUrl: '',
    isActive: true
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const loadQuery = async () => {
        try {
          await getQuery(id);
        } catch (err) {
          console.error('Failed to load query:', err);
          navigate('/queries');
        }
      };
      
      loadQuery();
    } else {
      clearCurrentQuery();
    }
    
    return () => {
      clearCurrentQuery();
    };
  }, [isEditMode, id, getQuery, navigate, clearCurrentQuery]);

  useEffect(() => {
    if (currentQuery) {
      setFormData({
        name: currentQuery.name,
        keywordsText: currentQuery.keywords.join(', '),
        categoriesText: currentQuery.categories ? currentQuery.categories.join(', ') : '',
        intervalMinutes: String(currentQuery.intervalMinutes),
        webhookUrl: currentQuery.webhookUrl,
        isActive: currentQuery.isActive
      });
    }
  }, [currentQuery]);

  const { name, keywordsText, categoriesText, intervalMinutes, webhookUrl, isActive } = formData;

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    
    setFormData({ ...formData, [e.target.name]: value });
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Parse keywords and categories
      const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k);
      
      if (keywords.length === 0) {
        setError('At least one keyword is required');
        setIsSubmitting(false);
        return;
      }

      const categories = categoriesText
        ? categoriesText.split(',').map(c => c.trim()).filter(c => c)
        : [];

      // Create query object
      const queryData = {
        name,
        keywords,
        categories: categories.length > 0 ? categories : undefined,
        intervalMinutes: Number(intervalMinutes),
        webhookUrl,
        isActive
      };

      if (isEditMode && currentQuery) {
        await updateQuery(id, queryData);
      } else {
        await createQuery(queryData);
      }

      navigate('/queries');
    } catch (err: any) {
      console.error('Error saving query:', err);
      setError(err.response?.data?.message || 'Error saving query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="query-form-page">
      <h1>{isEditMode ? 'Edit Query' : 'Create New Query'}</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Query Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            required
            placeholder="e.g. Nintendo Switch Deals"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="keywordsText">Keywords</label>
          <textarea
            id="keywordsText"
            name="keywordsText"
            value={keywordsText}
            onChange={onChange}
            required
            placeholder="Enter keywords separated by commas (e.g. nintendo, switch, console)"
          />
          <small>Separate keywords with commas. Deals matching any of these keywords will be found.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="categoriesText">Categories</label>
          <textarea
            id="categoriesText"
            name="categoriesText"
            value={categoriesText}
            onChange={onChange}
            placeholder="Enter categories separated by commas (optional)"
          />
          <small>Separate categories with commas. Leave empty to search all categories.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="intervalMinutes">Check Interval (minutes)</label>
          <input
            type="number"
            id="intervalMinutes"
            name="intervalMinutes"
            value={intervalMinutes}
            onChange={onChange}
            required
            min="30"
            step="1"
          />
          <small>Minimum interval is 30 minutes.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="webhookUrl">Webhook URL</label>
          <input
            type="url"
            id="webhookUrl"
            name="webhookUrl"
            value={webhookUrl}
            onChange={onChange}
            required
            placeholder="https://discord.com/api/webhooks/..."
          />
          <small>URL that will receive notifications when matching deals are found.</small>
        </div>
        
        <div className="form-group">
  <div className="switch-container">
    <div className="switch-header">
      <label htmlFor="isActive">Active Status</label>
      <div className="switch">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={isActive}
          onChange={onChange}
        />
        <span className="slider"></span>
      </div>
    </div>
    <div className="switch-description">
      <small>
        {isActive 
          ? "This query is active and will regularly check for matching deals."
          : "This query is inactive and won't check for new deals."
        }
      </small>
    </div>
  </div>
</div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/queries')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Query' : 'Create Query'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QueryForm;