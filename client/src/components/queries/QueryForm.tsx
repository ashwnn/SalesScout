import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QueryContext from '@/context/QueryContext';
import AuthContext from '@/context/AuthContext';
import { trackQuery, trackButton, trackDemoMode } from '@/utils/umami';
import '@/styles/query.css';

const QueryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const { createQuery, updateQuery, getQuery, currentQuery, clearCurrentQuery } = useContext(QueryContext);
  const { user } = useContext(AuthContext);

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
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    setFormData({ ...formData, [target.name]: value });
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
        trackQuery('updated', id, { name, keywordsCount: keywords.length });
        trackButton('update-query', {
          sessionType: user?.isDemo ? 'demo' : 'regular',
          queryId: id,
          keywordsCount: keywords.length
        });
        if (user?.isDemo) {
          trackDemoMode('update-query', { queryId: id });
        }
      } else {
        await createQuery(queryData);
        trackQuery('created', undefined, { name, keywordsCount: keywords.length });
        trackButton('create-query', {
          sessionType: user?.isDemo ? 'demo' : 'regular',
          keywordsCount: keywords.length
        });
        if (user?.isDemo) {
          trackDemoMode('create-query', { name, keywordsCount: keywords.length });
        }
      }

      navigate('/queries');
    } catch (err: any) {
      // Handle different error scenarios with user-friendly messages
      let errorMessage = 'Error saving query. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Invalid input. Please check your query details and try again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
      <label className="switch">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={isActive}
          onChange={onChange}
        />
        <span className="slider"></span>
      </label>
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