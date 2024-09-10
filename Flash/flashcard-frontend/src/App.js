import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [currentSummary, setCurrentSummary] = useState('');
  const [pastSummaries, setPastSummaries] = useState([]);
  const [error, setError] = useState(null);

  // Fetch past summaries
  useEffect(() => {
    fetch('http://localhost:3001/summaries')
      .then((res) => res.json())
      .then((data) => setPastSummaries(data))
      .catch((err) => setError('Failed to fetch past summaries'));
  }, []);

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const uploadResponse = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error uploading file');
      }

      const { summary } = await uploadResponse.json();
      setCurrentSummary(summary);
      setError(null);

      // Refresh past summaries
      fetch('http://localhost:3001/summaries')
        .then((res) => res.json())
        .then((data) => setPastSummaries(data))
        .catch((err) => setError('Failed to refresh summaries'));
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  // Remove specific summary
  const handleRemoveSummary = async (id) => {
    try {
      await fetch(`http://localhost:3001/summaries/${id}`, {
        method: 'DELETE',
      });
      setPastSummaries(pastSummaries.filter((summary) => summary._id !== id));
    } catch (error) {
      setError('Failed to delete summary');
    }
  };

  // Remove all summaries
  const handleRemoveAllSummaries = async () => {
    try {
      await fetch('http://localhost:3001/summaries', {
        method: 'DELETE',
      });
      setPastSummaries([]);
    } catch (error) {
      setError('Failed to delete all summaries');
    }
  };

  return (
    <div className="App">
      <h1>AI Flashcard Generator</h1>
      
      {/* Label for custom file input */}
      <label htmlFor="pdfFile" className="custom-file-upload">
        Choose File
      </label>
      <input type="file" id="pdfFile" accept=".pdf" onChange={handleFileChange} />
      
      <button className="upload-btn" onClick={handleFileUpload}>
        Upload and Generate Summary
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {currentSummary && (
        <div>
          <h2>Current Summary</h2>
          <p>{currentSummary}</p>
        </div>
      )}

      <div>
        <h2>Past Summaries</h2>
        {pastSummaries.length === 0 ? (
          <p>No past summaries available</p>
        ) : (
          <ul>
            {pastSummaries.map((summary) => (
              <li key={summary._id}>
                <strong>{summary.pdfName}</strong>
                <p>{summary.summary}</p>
                <button onClick={() => handleRemoveSummary(summary._id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {pastSummaries.length > 0 && (
          <button onClick={handleRemoveAllSummaries}>
            Remove All Summaries
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
