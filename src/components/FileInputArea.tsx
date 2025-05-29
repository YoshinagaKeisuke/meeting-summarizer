/**
 * @file FileInputArea.tsx
 * @description トランスクリプトファイルを選択するためのコンポーネント
 *
 * このコンポーネントでは、ユーザーがTeams会議のトランスクリプト（VTTファイル、TXTファイル、DOCXファイル）を
 * アップロードするためのファイル選択インターフェースを提供します。
 * ファイル選択ボタンとドラッグ＆ドロップの両方に対応しています。
 */

import React, { useState, useRef } from 'react';

/**
 * FileInputAreaコンポーネントのプロパティ
 */
interface FileInputAreaProps {
  /** 選択されたファイルを親コンポーネントに渡すコールバック関数 */
  onFileSelect: (file: File | null) => void;
  /** 現在選択されているファイル */
  selectedFile: File | null;
}

/**
 * トランスクリプトファイルを選択するためのコンポーネント
 *
 * @param props コンポーネントのプロパティ
 * @returns Reactコンポーネント
 */
const FileInputArea: React.FC<FileInputAreaProps> = ({ onFileSelect, selectedFile }) => {
  // ドラッグ状態を管理するための状態変数
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // ファイル入力要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択時のイベントハンドラ
   * 選択されたファイルを親コンポーネントに通知します
   *
   * @param event ファイル入力要素の変更イベント
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onFileSelect(file);
  };

  /**
   * ドラッグ開始時のイベントハンドラ
   *
   * @param event ドラッグイベント
   */
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  /**
   * ドラッグ中のイベントハンドラ
   *
   * @param event ドラッグイベント
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  /**
   * ドラッグ終了時のイベントハンドラ
   *
   * @param event ドラッグイベント
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  /**
   * ドロップ時のイベントハンドラ
   * ドロップされたファイルを親コンポーネントに通知します
   *
   * @param event ドロップイベント
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      // 対応ファイル形式のチェック
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.vtt') || fileName.endsWith('.txt') || fileName.endsWith('.docx')) {
        onFileSelect(file);
      } else {
        alert('VTT、TXT、DOCXファイル形式のみ対応しています。');
      }
    }
  };

  /**
   * ファイル選択ボタンクリック時のイベントハンドラ
   * 隠れたファイル入力要素をクリックします
   */
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * 選択されたファイルをクリアするハンドラ
   */
  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2 text-left">トランスクリプトファイル入力</h2>

      {/* ドラッグ＆ドロップエリア */}
      <div
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-2 flex flex-col items-center justify-center min-h-[150px]
          ${isDragging ? 'border-violet-500 bg-violet-50' :
            selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-violet-400'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-green-600">
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <button
              onClick={handleClearFile}
              className="mt-3 px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full hover:bg-red-200 transition-colors"
            >
              ファイルをクリア
            </button>
          </div>
        ) : (
          <>
            <svg
              className={`mx-auto h-12 w-12 ${isDragging ? 'text-violet-500' : 'text-gray-400'}`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              ファイルをドラッグ＆ドロップするか、<span className="text-violet-600 font-medium">クリックして選択</span>してください
            </p>
            <p className="mt-1 text-xs text-gray-500">
              VTT、TXT、DOCXファイル形式に対応しています
            </p>
          </>
        )}
      </div>

      {/* 隠れたファイル入力要素 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".vtt,.txt,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default FileInputArea;
