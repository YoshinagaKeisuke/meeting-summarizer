import React, { useState, useEffect } from 'react';

/**
 * @interface ApiEndpointAreaProps
 * @description ApiEndpointAreaコンポーネントのProps。APIエンドポイントの変更を処理するための関数と、初期エンドポイントを受け取ります。
 */
interface ApiEndpointAreaProps {
  /**
   * @param {string} endpoint - APIエンドポイント
   * @description APIエンドポイントが変更されたときに呼び出される関数
   */
  onEndpointChange: (endpoint: string) => void;
  /**
   * @param {string} [initialEndpoint] - 初期APIエンドポイント
   * @description 初期APIエンドポイント（オプション）
   */
  initialEndpoint?: string;
}

/**
 * @const ApiEndpointArea
 * @description LLM APIエンドポイントを設定するコンポーネント。APIエンドポイントの入力フィールドと保存ボタンを提供します。
 * @param {ApiEndpointAreaProps} props - Props
 */
const ApiEndpointArea: React.FC<ApiEndpointAreaProps> = ({ onEndpointChange, initialEndpoint }) => {
  // APIエンドポイントの状態を管理
  const [endpoint, setEndpoint] = useState(initialEndpoint || '');
  // APIエンドポイントの有効性の状態を管理
  const [isValid, setIsValid] = useState(true);

  // initialEndpointが変更されたときに実行される副作用フック
  useEffect(() => {
    if (initialEndpoint) {
      setEndpoint(initialEndpoint);
      validateAndNotify(initialEndpoint);
    }
  }, [initialEndpoint]);

  /**
   * @function validateAndNotify
   * @description APIエンドポイントを検証し、親コンポーネントに通知する関数。URLの形式が正しいかどうかを検証し、親コンポーネントに通知します。
   * @param {string} currentEndpoint - 現在のAPIエンドポイント
   */
  const validateAndNotify = (currentEndpoint: string) => {
    // Basic URL validation (can be improved)
    let valid = false;
    try {
      new URL(currentEndpoint);
      valid = currentEndpoint.startsWith('http://') || currentEndpoint.startsWith('https://');
    } catch (_) {
      valid = false;
    }
    setIsValid(valid);
    if (valid) {
      onEndpointChange(currentEndpoint);
    }
  };

  /**
   * @function handleChange
   * @description 入力フィールドの変更を処理する関数。入力された値を状態に設定します。
   * @param {React.ChangeEvent<HTMLInputElement>} event - イベントオブジェクト
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndpoint = event.target.value;
    setEndpoint(newEndpoint);
    // Validate on change but only save and notify parent on blur or explicit save
  };

  /**
   * @function handleBlur
   * @description 入力フィールドからフォーカスが外れたときの処理。入力された値を検証します。
   */
  const handleBlur = () => {
    validateAndNotify(endpoint);
  };

  /**
   * @function handleSave
   * @description 保存ボタンがクリックされたときの処理。入力された値を検証し、ローカルストレージに保存します。
   */
  const handleSave = () => {
    validateAndNotify(endpoint);
    if (isValid && endpoint) {
      localStorage.setItem('apiEndpoint', endpoint);
      alert('APIエンドポイントを保存しました。');
    } else if (!endpoint) {
      localStorage.removeItem('apiEndpoint');
      onEndpointChange(''); // Notify parent that endpoint is cleared
      alert('APIエンドポイントをクリアしました。');
    } else {
      alert('無効なURL形式です。http:// または https:// で始まる正しいURLを入力してください。');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2">LLM APIエンドポイント設定</h2>
      <label htmlFor="api-endpoint" className="block text-sm font-medium text-gray-700">APIエンドポイントURL</label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="url"
          name="api-endpoint"
          id="api-endpoint"
          value={endpoint}
          onChange={handleChange}
          onBlur={handleBlur} // Validate and notify on blur
          className={`flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 border ${isValid ? 'border-gray-300' : 'border-red-500'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          placeholder="http://localhost:8080/v1/chat/completions"
        />
        <button
          onClick={handleSave}
          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm"
        >
          保存
        </button>
      </div>
      {!isValid && endpoint && (
        <p className="text-xs text-red-500 mt-1">無効なURL形式です。http:// または https:// で始まるURLを入力してください。</p>
      )}
      <p className="text-xs text-gray-500 mt-1">ローカルで動作しているLLMのAPIエンドポイントを指定してください。空欄にして保存すると設定がクリアされます。</p>
    </div>
  );
};

export default ApiEndpointArea;
