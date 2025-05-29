/**
 * @file FormatSpecArea.tsx
 * @description 議事録フォーマットテンプレートとLLMプロンプトの設定を行うコンポーネント
 *
 * このコンポーネントでは、議事録のテンプレート選択・編集・保存と、
 * LLMへの指示（プロンプト）の設定・保存機能を提供します。
 * アコーディオン形式で表示/非表示を切り替えることができます。
 */

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

/**
 * 議事録テンプレートを表すインターフェース
 */
export interface MeetingMinutesTemplate {
  /** テンプレート名 */
  name: string;
  /** Markdown形式のテンプレート文字列 */
  content: string;
}

/**
 * FormatSpecAreaコンポーネントのプロパティ
 */
interface FormatSpecAreaProps {
  /** 選択されたテンプレートの内容を親コンポーネントに渡すコールバック */
  onTemplateContentChange: (templateContent: string) => void;
  /** 現在のLLMプロンプト（親コンポーネントから渡される） */
  currentLlmPrompt: string;
  /** LLMプロンプトの変更を親コンポーネントに通知するコールバック */
  onLlmPromptChange: (prompt: string) => void;
  /** 現在のテンプレート内容（親コンポーネントから渡される） */
  templateContent?: string;
}

/** デフォルトテンプレート名 */
const DEFAULT_TEMPLATE_NAME = "デフォルト";
/** ローカルストレージに保存する際のプレフィックス */
const CUSTOM_TEMPLATE_PREFIX = "custom_minutes_template_";

/**
 * デフォルトの議事録テンプレート内容
 */
const USER_DEFAULT_TEMPLATE_CONTENT = `
## 会議タイトル
{{会議名}}
## 日時・メンバー
- 日時: {{日時}}
- 開催場所: オンライン
- メンバー(順不同・敬称略):
  - {{メンバー1}}
  - {{メンバー2}}

## 目的
{{会議の目的}}

## アジェンダ
- {{アジェンダ1}}
- {{アジェンダ2}}

## 各議題と内容
### {{議題1}}
{{議題1の内容}}
### {{議題2}}
{{議題2の内容}}

## 宿題
- {{宿題1}}
- {{宿題2}}

## メモ
{{メモ}}

`;

/**
 * デフォルトのLLMプロンプト
 */
const DEFAULT_LLM_PROMPT = `・トランスクリプトファイルから議事録を作成してください。
・テンプレートの各項目に適切な内容を入れてください。
・できる限り詳しく記述してください。
・重要なポイントを強調してください。
・会議の内容以外は出力しないでください。
`;

/**
 * 議事録フォーマットテンプレートとLLMプロンプトの設定を行うコンポーネント
 *
 * @param props コンポーネントのプロパティ
 * @returns Reactコンポーネント
 */
const FormatSpecArea: React.FC<FormatSpecAreaProps> = ({
  onTemplateContentChange,
  currentLlmPrompt,
  onLlmPromptChange,
  templateContent,
}) => {
  // 状態変数の定義
  /** 選択中のテンプレート名 */
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(DEFAULT_TEMPLATE_NAME);
  /** 現在編集中のテンプレート内容 */
  const [currentTemplateContent, setCurrentTemplateContent] = useState<string>("");
  /** 新規保存時のテンプレート名 */
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  /** 保存済みのテンプレート一覧 */
  const [savedTemplates, setSavedTemplates] = useState<Record<string, MeetingMinutesTemplate>>({});
  /** LLMへの指示（プロンプト） */
  const [localLlmPrompt, setLocalLlmPrompt] = useState<string>("");
  /** アコーディオンの開閉状態 */
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false); // デフォルトで閉じた状態に変更
  /** 初期化完了フラグ */
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * 初期化処理
   * ローカルストレージからテンプレートとLLMプロンプトを読み込みます
   */
  useEffect(() => {
    // 保存済みテンプレートの読み込み
    const loadedTemplates: Record<string, MeetingMinutesTemplate> = {};
    let defaultTemplateExists = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CUSTOM_TEMPLATE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item) as MeetingMinutesTemplate;
            loadedTemplates[parsed.name] = parsed;
            if (parsed.name === DEFAULT_TEMPLATE_NAME) {
              defaultTemplateExists = true;
            }
          }
        } catch (e) {
          console.error("Error parsing template from localStorage", e);
        }
      }
    }

    // デフォルトテンプレートがない場合は作成
    if (!defaultTemplateExists) {
      loadedTemplates[DEFAULT_TEMPLATE_NAME] = {
        name: DEFAULT_TEMPLATE_NAME,
        content: USER_DEFAULT_TEMPLATE_CONTENT,
      };
    }
    setSavedTemplates(loadedTemplates);

    // 初期テンプレートの設定
    const initialTemplate = loadedTemplates[DEFAULT_TEMPLATE_NAME] || { name: DEFAULT_TEMPLATE_NAME, content: USER_DEFAULT_TEMPLATE_CONTENT };
    setCurrentTemplateContent(initialTemplate.content);
    onTemplateContentChange(initialTemplate.content);
    setSelectedTemplateName(initialTemplate.name);

    // LLMプロンプトの初期化
    const storedLlmPrompt = localStorage.getItem('llmPrompt');
    if (storedLlmPrompt) {
      setLocalLlmPrompt(storedLlmPrompt);
      onLlmPromptChange(storedLlmPrompt);
    } else {
      setLocalLlmPrompt(DEFAULT_LLM_PROMPT);
      onLlmPromptChange(DEFAULT_LLM_PROMPT);
    }

    setIsInitialized(true);
  }, []); // 空の依存配列で初回のみ実行

  /**
   * 親からのpropsを初期値として設定するuseEffect
   */
  useEffect(() => {
    // 初期化済みの場合は親からの更新を無視
    if (!isInitialized) {
      if (currentLlmPrompt) {
        setLocalLlmPrompt(currentLlmPrompt);
      }
      if (templateContent) {
        setCurrentTemplateContent(templateContent);
      }
    }
  }, [currentLlmPrompt, templateContent, isInitialized]);

  /**
   * テンプレート内容変更時のハンドラ
   * @param event テキストエリアの変更イベント
   */
  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setCurrentTemplateContent(newContent);
    onTemplateContentChange(newContent);
  };

  /**
   * LLMプロンプト変更時のハンドラ
   * @param event テキストエリアの変更イベント
   */
  const handleLlmPromptTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = event.target.value;
    setLocalLlmPrompt(newPrompt);
    onLlmPromptChange(newPrompt);
  };

  /**
   * LLMプロンプト保存ボタンクリック時のハンドラ
   */
  const handleSaveLlmPrompt = () => {
    localStorage.setItem('llmPrompt', localLlmPrompt);
    alert('LLMへの指示を保存しました。');
  };

  /**
   * テンプレート保存ボタンクリック時のハンドラ
   */
  const handleSaveTemplate = () => {
    const trimmedName = newTemplateName.trim();
    if (!trimmedName) {
      alert("テンプレート名を入力してください。");
      return;
    }
    if (trimmedName === DEFAULT_TEMPLATE_NAME && selectedTemplateName !== DEFAULT_TEMPLATE_NAME) {
      alert(`"${DEFAULT_TEMPLATE_NAME}" という名前で新規保存はできません。デフォルトテンプレートを編集する場合は、現在の内容が自動的に "${DEFAULT_TEMPLATE_NAME}" として保存されます。`);
      return;
    }

    // 保存するテンプレートオブジェクトの作成
    const templateToSave: MeetingMinutesTemplate = {
      name: trimmedName,
      content: currentTemplateContent,
    };

    // 状態とローカルストレージの両方に保存
    const newTemplates = { ...savedTemplates, [trimmedName]: templateToSave };
    setSavedTemplates(newTemplates);
    localStorage.setItem(CUSTOM_TEMPLATE_PREFIX + trimmedName, JSON.stringify(templateToSave));
    alert(`テンプレート「${trimmedName}」を保存しました。`);
    setNewTemplateName("");
    setSelectedTemplateName(trimmedName);
  };

  /**
   * テンプレート選択時のハンドラ
   * @param event セレクトボックスの変更イベント
   */
  const handleLoadTemplate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nameToLoad = event.target.value;
    if (savedTemplates[nameToLoad]) {
      setSelectedTemplateName(nameToLoad);
      setCurrentTemplateContent(savedTemplates[nameToLoad].content);
      onTemplateContentChange(savedTemplates[nameToLoad].content);
    } else {
      // 選択されたテンプレートが見つからない場合はデフォルトに戻す
      const defaultTpl = { name: DEFAULT_TEMPLATE_NAME, content: USER_DEFAULT_TEMPLATE_CONTENT };
      setSelectedTemplateName(DEFAULT_TEMPLATE_NAME);
      setCurrentTemplateContent(defaultTpl.content);
      onTemplateContentChange(defaultTpl.content);
      setSavedTemplates(prev => ({ ...prev, [DEFAULT_TEMPLATE_NAME]: defaultTpl }));
    }
  };

  /**
   * テンプレート削除ボタンクリック時のハンドラ
   */
  const handleDeleteTemplate = () => {
    if (selectedTemplateName && selectedTemplateName !== DEFAULT_TEMPLATE_NAME && savedTemplates[selectedTemplateName]) {
      if (window.confirm(`テンプレート「${selectedTemplateName}」を削除してもよろしいですか？`)) {
        // 状態とローカルストレージから削除
        const newTemplates = { ...savedTemplates };
        delete newTemplates[selectedTemplateName];
        setSavedTemplates(newTemplates);
        localStorage.removeItem(CUSTOM_TEMPLATE_PREFIX + selectedTemplateName);
        alert(`テンプレート「${selectedTemplateName}」を削除しました。`);

        // デフォルトテンプレートに戻す
        const defaultTpl = savedTemplates[DEFAULT_TEMPLATE_NAME] || { name: DEFAULT_TEMPLATE_NAME, content: USER_DEFAULT_TEMPLATE_CONTENT };
        setSelectedTemplateName(DEFAULT_TEMPLATE_NAME);
        setCurrentTemplateContent(defaultTpl.content);
        onTemplateContentChange(defaultTpl.content);
      }
    } else if (selectedTemplateName === DEFAULT_TEMPLATE_NAME) {
      alert("デフォルトテンプレートは削除できません。");
    } else {
      alert("削除するテンプレートを選択してください。");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      {/* アコーディオンヘッダー */}
      <button
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        className="w-full flex justify-between items-center text-lg font-semibold mb-4 p-2 hover:bg-gray-100 rounded-md focus:outline-none"
      >
        議事録フォーマットテンプレート設定
        {isAccordionOpen ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
      </button>

      {/* アコーディオンの内容 */}
      {isAccordionOpen && (
        <>
          {/* LLMプロンプト設定セクション - 順序を入れ替え */}
          <div className="mb-6">
            <h3 className="font-medium mb-2 text-md text-left">LLMへの指示 (プロンプト)</h3>
            <textarea
              name="llmPrompt"
              value={localLlmPrompt}
              onChange={handleLlmPromptTextareaChange}
              rows={5}
              className="w-full p-2 border border-gray-300 rounded-md resize-y"
              placeholder="例: 議事録を要約し、重要なポイントを抽出してください。"
            />
            <button
              onClick={handleSaveLlmPrompt}
              className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              LLMへの指示を保存
            </button>
          </div>

          <hr className="my-6" />

          {/* テンプレート選択セクション */}
          <div className="mb-4">
            <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1 text-left">テンプレートを選択</label>
            <div className="flex items-center gap-2">
              <select id="template-select" value={selectedTemplateName} onChange={handleLoadTemplate} className="border border-gray-300 rounded-md p-2 flex-grow">
                {Object.keys(savedTemplates).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={handleDeleteTemplate}
                disabled={selectedTemplateName === DEFAULT_TEMPLATE_NAME || !savedTemplates[selectedTemplateName]}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded disabled:opacity-50 text-sm"
              >
                削除
              </button>
            </div>
          </div>

          {/* テンプレート編集セクション */}
          <div className="mb-4">
            <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1 text-left">テンプレート内容</label>
            <textarea
              id="template-content"
              value={currentTemplateContent}
              onChange={handleTextareaChange}
              rows={15}
              className="w-full p-2 border border-gray-300 rounded-md resize-y font-mono text-sm"
              placeholder="ここにMarkdown形式の議事録テンプレートを入力します。例: # {{会議名}}"
            />
          </div>

          {/* テンプレート保存セクション */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="新しいテンプレート名として保存"
              className="border border-gray-300 rounded-md p-2 flex-grow"
            />
            <button
              onClick={handleSaveTemplate}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              名前を付けて保存
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FormatSpecArea;
