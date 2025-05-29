import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// LLM種類の型定義
export type LlmType = 'gemini' | 'ollama';

// 設定モーダルのプロパティ型定義
interface SettingsModalProps {
  /** モーダルが開いているかどうか */
  isOpen: boolean;
  /** Gemini APIキー */
  geminiApiKey: string;
  /** 現在のLLM種類 */
  llmType: LlmType;
  /** Ollama URL */
  ollamaUrl: string;
  /** Ollamaモデル名 */
  ollamaModel: string;
  /** APIサーバーURL */
  apiServerUrl: string;
  /** APIキー */
  apiKey: string;
  /** APIサーバー使用フラグ */
  useApiServer: boolean;
  /** APIサーバー接続状態 */
  apiServerConnected: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** 設定を保存する時のコールバック */
  onSave: (
    newGeminiApiKey: string,
    newLlmType: LlmType,
    newOllamaUrl: string,
    newOllamaModel: string,
    newApiServerUrl: string,
    newApiKey: string,
    newUseApiServer: boolean
  ) => void;
}

/**
 * 設定モーダルコンポーネント
 * LLM APIキーやOllama設定などの設定を行うモーダルダイアログ
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  geminiApiKey,
  llmType,
  ollamaUrl,
  ollamaModel,
  apiServerUrl,
  apiKey,
  useApiServer,
  apiServerConnected,
  onClose,
  onSave
}) => {
  // 一時的な入力値を保持する状態
  const [tempGeminiApiKey, setTempGeminiApiKey] = useState(geminiApiKey);
  const [tempLlmType, setTempLlmType] = useState<LlmType>(llmType);
  const [tempOllamaUrl, setTempOllamaUrl] = useState(ollamaUrl);
  const [tempOllamaModel, setTempOllamaModel] = useState(ollamaModel);
  const [tempApiServerUrl, setTempApiServerUrl] = useState(apiServerUrl);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempUseApiServer, setTempUseApiServer] = useState(useApiServer);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // モーダルが表示されるたびに一時的な入力値を更新
  useEffect(() => {
    if (isOpen) {
      setTempGeminiApiKey(geminiApiKey);
      setTempLlmType(llmType);
      setTempOllamaUrl(ollamaUrl);
      setTempOllamaModel(ollamaModel);
      setTempApiServerUrl(apiServerUrl);
      setTempApiKey(apiKey);
      setTempUseApiServer(useApiServer);
      setHasChanges(false);
    }
  }, [isOpen, geminiApiKey, llmType, ollamaUrl, ollamaModel, apiServerUrl, apiKey, useApiServer]);

  // 変更検知
  useEffect(() => {
    const hasChanged =
      tempGeminiApiKey !== geminiApiKey ||
      tempLlmType !== llmType ||
      tempOllamaUrl !== ollamaUrl ||
      tempOllamaModel !== ollamaModel ||
      tempApiServerUrl !== apiServerUrl ||
      tempApiKey !== apiKey ||
      tempUseApiServer !== useApiServer;

    setHasChanges(hasChanged);
  }, [
    tempGeminiApiKey, tempLlmType, tempOllamaUrl, tempOllamaModel,
    tempApiServerUrl, tempApiKey, tempUseApiServer,
    geminiApiKey, llmType, ollamaUrl, ollamaModel,
    apiServerUrl, apiKey, useApiServer
  ]);

  // 設定を保存するハンドラ
  const handleSave = () => {
    onSave(
      tempGeminiApiKey,
      tempLlmType,
      tempOllamaUrl,
      tempOllamaModel,
      tempApiServerUrl,
      tempApiKey,
      tempUseApiServer
    );
    onClose();
  };

  // 閉じるボタンまたはキャンセルボタンが押された時のハンドラ
  const handleClose = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  };

  // 変更破棄確認ダイアログ
  const DiscardChangesDialog = () => (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">変更を破棄しますか？</h3>
          <p className="text-sm text-gray-500 mb-4">
            設定に変更があります。保存せずに閉じると、これらの変更は失われます。
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDiscardDialog(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                setShowDiscardDialog(false);
                onClose();
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              破棄する
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* モーダルコンテナ */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-xl w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">設定</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* APIサーバー使用設定 */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useApiServer"
                  checked={tempUseApiServer}
                  onChange={(e) => setTempUseApiServer(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="useApiServer" className="ml-2 text-lg font-medium text-gray-900">
                  APIサーバーを使用する
                </label>
              </div>
              <p className="text-sm text-gray-500">
                APIサーバーを使用すると、Power Automateなどの外部サービスと同じバックエンドを共有できます。
              </p>
              {tempUseApiServer && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apiServerConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {apiServerConnected ? '接続済み' : '未接続'}
                  </span>
                </div>
              )}
            </div>

            {/* APIサーバー設定セクション */}
            {tempUseApiServer && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">APIサーバー設定</h3>

                {/* APIサーバーURL */}
                <div className="mb-4">
                  <label htmlFor="apiServerUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    APIサーバーURL
                  </label>
                  <input
                    type="text"
                    id="apiServerUrl"
                    value={tempApiServerUrl}
                    onChange={(e) => setTempApiServerUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    APIサーバーのURL（例: http://localhost:3000）
                  </p>
                </div>

                {/* APIキー */}
                <div className="mb-4">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    APIキー
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="APIキーを入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    APIサーバーへのアクセスに必要なAPIキー
                  </p>
                </div>
              </div>
            )}

            {/* LLM設定セクション - APIサーバー使用有無に関わらず常に表示 */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">LLM設定</h3>

              {/* LLM種類選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LLM種類
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="gemini"
                      checked={tempLlmType === 'gemini'}
                      onChange={() => setTempLlmType('gemini')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">Gemini API</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="ollama"
                      checked={tempLlmType === 'ollama'}
                      onChange={() => setTempLlmType('ollama')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">Ollama</span>
                  </label>
                </div>
              </div>

              {/* Gemini API設定 */}
              {tempLlmType === 'gemini' && (
                <div className="mb-4">
                  <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini APIキー
                  </label>
                  <input
                    type="password"
                    id="geminiApiKey"
                    value={tempGeminiApiKey}
                    onChange={(e) => setTempGeminiApiKey(e.target.value)}
                    placeholder="Gemini APIキーを入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    <a
                      href="https://ai.google.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google AI Studio
                    </a>
                    から取得したAPIキーを入力してください
                  </p>
                </div>
              )}

              {/* Ollama設定 */}
              {tempLlmType === 'ollama' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ollamaUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Ollama URL
                    </label>
                    <input
                      type="text"
                      id="ollamaUrl"
                      value={tempOllamaUrl}
                      onChange={(e) => setTempOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Ollamaサーバーのエンドポイント（デフォルト: http://localhost:11434）
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ollamaModel" className="block text-sm font-medium text-gray-700 mb-1">
                      Ollamaモデル名
                    </label>
                    <input
                      type="text"
                      id="ollamaModel"
                      value={tempOllamaModel}
                      onChange={(e) => setTempOllamaModel(e.target.value)}
                      placeholder="llama3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      使用するOllamaモデル名（例: llama3, mistral, gemma）
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 変更破棄確認ダイアログ */}
      {showDiscardDialog && <DiscardChangesDialog />}
    </div>
  );
};

export default SettingsModal;
