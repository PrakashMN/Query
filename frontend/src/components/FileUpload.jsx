function FileUpload({ label, accept, multiple = false, files, onChange, helper }) {
  return (
    <label className="upload-field">
      <span>{label}</span>
      <input type="file" accept={accept} multiple={multiple} onChange={onChange} />
      <div className="upload-dropzone">
        <strong>Select file{multiple ? "s" : ""}</strong>
        <small>{helper}</small>
      </div>
      {files?.length ? (
        <div className="file-list">
          {Array.from(files).map((file) => (
            <span key={`${file.name}-${file.size}`}>{file.name}</span>
          ))}
        </div>
      ) : null}
    </label>
  );
}

export default FileUpload;
