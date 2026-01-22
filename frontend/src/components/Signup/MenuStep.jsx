import React, { useRef } from 'react';
import Button from '../ui/Button';
import { Upload, FileSpreadsheet } from 'lucide-react';

const MenuStep = ({ data, updateData, next, back }) => {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateData({ menuSource: 'excel', menuFile: file.name });
            setTimeout(() => next(), 500);
        }
    };

    const handleManualAdd = () => {
        updateData({ menuSource: 'manual' });
        next();
    };

    const handleSkip = () => {
        updateData({ menuSource: 'skip' });
        next();
    };

    return (
        <div className="auth-form">
            <div
                onClick={handleUploadClick}
                className="upload-area"
            >
                <div className="upload-icon">
                    <FileSpreadsheet size={48} />
                </div>
                <p className="upload-title">Upload Menu (Excel/CSV)</p>
                <p className="upload-subtitle">Click to browse or drag and drop</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileChange}
                />
            </div>

            <div style={{ textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '0.875rem' }}>
                or
            </div>

            <Button
                variant="secondary"
                size="large"
                onClick={handleManualAdd}
                style={{ width: '100%' }}
            >
                Add Menu Items Manually
            </Button>

            <div className="form-actions" style={{ marginTop: 'var(--spacing-8)' }}>
                <Button variant="ghost" onClick={back} style={{ flex: 1 }}>
                    Back
                </Button>
                <Button variant="ghost" onClick={handleSkip} style={{ flex: 1 }}>
                    Skip for Now
                </Button>
            </div>
        </div>
    );
};

export default MenuStep;
