/**
 * @file ApiKeyArea.tsx
 * @description Gemini APIキーを設定するためのコンポーネント
 * 
 * このコンポーネントでは、Gemini APIキーの入力、保存、および
 * 状態管理を行います。APIキーはローカルストレージに保存され、
 * 親コンポーネントに変更が通知されます。
 */

import React, { useState, useEffect } from 'react';

/**
 * ApiKeyAreaコンポーネントのプロパティ
 */
interface ApiKeyAreaProps {
  /** APIキー変更時のコールバック関数 */
  onApiKeyChange: (apiKey: string) => void;
  /** 初期APIキー値（オプション） */
  initialApiKey?: string;
}

/**
 * Gemini APIキーを設定するためのコンポーネント
 * 
 * @param props コンポーネントのプロパティ
 * @returns Reactコンポーネント
 */
const ApiKeyArea: React.FC<ApiKeyAreaProps> = ({ onApiKeyChange, initialApiKey }) => {
  /** 現在入力されているAPIキー */
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  /** APIキーが入力されているかのフラグ */
  const [isKeyEntered, setIsKeyEntered] = useState(!!initialApiKey);

  /**
   * 初期化処理
   * 初期APIキーが提供された場合、状態を更新し親コンポーネントに通知します
   */
  useEffect(() => {
    if (initialApiKey) {
      setApiKey(initialApiKey);
      setIsKeyEntered(true);
      onApiKeyChange(initialApiKey); // 初期ロード時に親コンポーネントに通知
    }
  }, [initialApiKey, onApiKeyChange]);

  /**
   * APIキー入力フィールド変更時のハンドラ
   * @param event 入力イベント
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = event.target.value;
    setApiKey(newApiKey);
    setIsKeyEntered(!!newApiKey.trim()); // キーが入力されているかに基づいて状態を更新
  };

  /**
   * APIキー保存ボタンクリック時のハンドラ
   * APIキーをローカルストレージに保存し、親コンポーネントに通知します
   */
  const handleSave = () => {
    const trimmedApiKey = apiKey.trim();
    if (trimmedApiKey) {
      localStorage.setItem('geminiApiKey', trimmedApiKey);
      onApiKeyChange(trimmedApiKey); // 新しいキーを親コンポーネントに通知
      setIsKeyEntered(true);
      alert('Gemini APIキーを保存しました。');
    } else {
      localStorage.removeItem('geminiApiKey');
      onApiKeyChange(''); // APIキーがクリアされたことを親コンポーネントに通知
      setIsKeyEntered(false);
      alert('Gemini APIキーをクリアしました。空のキーは保存されません。');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2">Gemini APIキー設定</h2>
      <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700">APIキー</label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="password" // セキュリティのためパスワードタイプを使用
          name="gemini-api-key"
          id="gemini-api-key"
          value={apiKey}
          onChange={handleChange}
          className={`flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 border ${isKeyEntered || !apiKey ? 'border-gray-300' : 'border-red-500'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          placeholder="ここにGemini APIキーを入力してください"
        />
        <button 
            onClick={handleSave}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm"
        >
            保存
        </button>
      </div>
      {/* バリデーションエラーメッセージ */}
      {apiKey && !isKeyEntered && (
        <p className="text-xs text-red-500 mt-1">APIキーを入力してください。</p>
      )}
      <p className="text-xs text-gray-500 mt-1">Google AI Studioで取得したGemini APIキーを入力してください。空欄にして保存すると設定がクリアされます。</p>
    </div>
  );
};

export default ApiKeyArea;
