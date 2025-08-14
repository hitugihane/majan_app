import { useState } from 'react';

// Type definitions for some state variables
interface Melds {
  pon: boolean;
  kan: boolean;
  chi: boolean;
}

interface Options {
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  haitei: boolean;
  rinshan: boolean;
  chankan: boolean;
  tenhou: boolean;
  chiihou: boolean;
}

/**
 * Root component for the Mahjong score calculator wizard.
 *
 * This component presents a multi‑step form that collects information about
 * the player's hand and circumstances. At the final step it summarizes
 * the selections and performs a simplified score calculation.
 */
function App() {
  // Labels for the wizard steps
  const stepTitles = [
    '特殊なメンツの役かどうか',
    'ポン・カン・チーの有無',
    '面子の入力',
    '頭の入力',
    '和了牌の入力',
    'リーチなどの宣言',
    '場風と自風',
    '結果の表示',
  ];

  // Step index (1‑based)
  const [step, setStep] = useState(1);
  // Special hand (chitoitsu, kokushi, or none)
  const [specialHand, setSpecialHand] = useState<string>('none');
  // Whether the hand contains Pon, Kan, Chi
  const [melds, setMelds] = useState<Melds>({ pon: false, kan: false, chi: false });
  // Closed melds input
  const [closedMentsu, setClosedMentsu] = useState<string>('');
  // Pair (head) input
  const [pair, setPair] = useState<string>('');
  // Winning tile input
  const [winningTile, setWinningTile] = useState<string>('');
  // Additional options such as Riichi, Ippatsu, etc.
  const [options, setOptions] = useState<Options>({
    riichi: false,
    doubleRiichi: false,
    ippatsu: false,
    haitei: false,
    rinshan: false,
    chankan: false,
    tenhou: false,
    chiihou: false,
  });
  // Seat and prevailing winds
  const [winds, setWinds] = useState<{ seat: string; prevailing: string }>({ seat: 'east', prevailing: 'east' });

  // Navigate to the next step
  const next = () => setStep((prev) => Math.min(prev + 1, stepTitles.length));
  // Navigate to the previous step
  const prev = () => setStep((prev) => Math.max(prev - 1, 1));

  // Determine the han value awarded for a given option.
  const getHanForOption = (key: keyof Options): number => {
    switch (key) {
      case 'riichi':
        return 1;
      case 'doubleRiichi':
        return 2;
      case 'ippatsu':
        return 1;
      case 'haitei':
        return 1;
      case 'rinshan':
        return 1;
      case 'chankan':
        return 1;
      case 'tenhou':
        return 13;
      case 'chiihou':
        return 13;
      default:
        return 0;
    }
  };

  /**
   * Calculate the han, fu, base points and total points for the current inputs.
   * This is a simplified scoring implementation intended for demonstration. It
   * handles yakuman (国士無双, 天和, 地和), seven pairs (チートイツ), and a few
   * common bonuses such as リーチや一発. For general hands it sums han from
   * selected options and computes fu based on meld counts. Points are capped
   * according to the standard Riichi rules (Mangan limit).
   */
  const calculateScore = () => {
    // Handle yakuman hands (special case)
    if (specialHand === 'kokushi' || options.tenhou || options.chiihou) {
      const han = 13;
      const fu = 0;
      // Yakuman fixed base points
      const basePoints = 8000;
      // Dealer pays 48,000 points, non‑dealer pays 32,000
      const totalPoints = winds.seat === 'east' ? 48000 : 32000;
      return { han, fu, basePoints, totalPoints };
    }
    // Seven pairs (チートイツ) case
    if (specialHand === 'chitoitsu') {
      let han = 2;
      let fu = 25;
      // Fu from meld types: Pon adds 2 fu, Kan adds 4 fu
      if (melds.pon) fu += 2;
      if (melds.kan) fu += 4;
      // Fu for each closed meld input
      const groups = closedMentsu.trim() ? closedMentsu.trim().split(/\s+/).length : 0;
      fu += groups * 2;
      // Fu for pair
      if (pair) fu += 2;
      // Fu for winning with Ron
      if (winningTile) fu += 2;
      // Additional han from selected options
      for (const key of Object.keys(options) as Array<keyof Options>) {
        if (options[key]) {
          han += getHanForOption(key);
        }
      }
      fu = Math.max(fu, 20);
      const base = fu * Math.pow(2, han + 2);
      const basePoints = base > 2000 ? 2000 : base;
      const totalPoints = winds.seat === 'east' ? basePoints * 6 : basePoints * 4;
      return { han, fu, basePoints, totalPoints };
    }
    // General hand
    let han = 0;
    let fu = 20;
    // Fu from exposed melds
    if (melds.pon) fu += 2;
    if (melds.kan) fu += 4;
    // Fu for closed meld count
    const groups = closedMentsu.trim() ? closedMentsu.trim().split(/\s+/).length : 0;
    fu += groups * 2;
    // Fu for pair
    if (pair) fu += 2;
    // Fu for winning by Ron
    if (winningTile) fu += 2;
    // Accumulate han from each selected option
    for (const key of Object.keys(options) as Array<keyof Options>) {
      if (options[key]) {
        han += getHanForOption(key);
      }
    }
    // If no yaku, score is zero
    if (han === 0) {
      return { han: 0, fu, basePoints: 0, totalPoints: 0 };
    }
    const base = fu * Math.pow(2, han + 2);
    const basePoints = base > 2000 ? 2000 : base;
    const totalPoints = winds.seat === 'east' ? basePoints * 6 : basePoints * 4;
    return { han, fu, basePoints, totalPoints };
  };

  // Render the UI for the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">特殊なメンツの役かどうかを選択してください</p>
            <select
              className="border rounded p-2 w-full"
              value={specialHand}
              onChange={(e) => setSpecialHand(e.target.value)}
            >
              <option value="none">なし</option>
              <option value="chitoitsu">チートイツ（七対子）</option>
              <option value="kokushi">国士無双</option>
            </select>
          </div>
        );
      case 2:
        return (
          <div className="space-y-2">
            <p className="text-lg font-semibold">副露（ポン・カン・チー）の有無を選択してください</p>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={melds.pon}
                onChange={(e) => setMelds({ ...melds, pon: e.target.checked })}
              />
              <span>ポンがある</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={melds.kan}
                onChange={(e) => setMelds({ ...melds, kan: e.target.checked })}
              />
              <span>カンがある</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={melds.chi}
                onChange={(e) => setMelds({ ...melds, chi: e.target.checked })}
              />
              <span>チーがある</span>
            </label>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">面前の面子を入力してください（空白区切り）</p>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={closedMentsu}
              onChange={(e) => setClosedMentsu(e.target.value)}
              placeholder="例: m123 p456 s789"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">頭（雀頭）を入力してください</p>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder="例: m55"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">和了牌を入力してください</p>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={winningTile}
              onChange={(e) => setWinningTile(e.target.value)}
              placeholder="例: p5"
            />
          </div>
        );
      case 6: {
        // Prepare an array of option keys and labels
        const optionKeys: Array<keyof Options> = [
          'riichi',
          'doubleRiichi',
          'ippatsu',
          'haitei',
          'rinshan',
          'chankan',
          'tenhou',
          'chiihou',
        ];
        const labels: Record<keyof Options, string> = {
          riichi: 'リーチ',
          doubleRiichi: 'ダブルリーチ',
          ippatsu: '一発',
          haitei: '海底',
          rinshan: '嶺上開花',
          chankan: '槍槓',
          tenhou: '天和',
          chiihou: '地和',
        };
        return (
          <div className="space-y-2">
            <p className="text-lg font-semibold">リーチなどの状況を選択してください</p>
            {optionKeys.map((key) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                />
                <span>{labels[key]}</span>
              </label>
            ))}
          </div>
        );
      }
      case 7:
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">場風と自風を選択してください</p>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2">
                <span>場風:</span>
                <select
                  className="border rounded p-2 flex-1"
                  value={winds.prevailing}
                  onChange={(e) => setWinds({ ...winds, prevailing: e.target.value })}
                >
                  <option value="east">東</option>
                  <option value="south">南</option>
                  <option value="west">西</option>
                  <option value="north">北</option>
                </select>
              </label>
              <label className="flex items-center space-x-2">
                <span>自風:</span>
                <select
                  className="border rounded p-2 flex-1"
                  value={winds.seat}
                  onChange={(e) => setWinds({ ...winds, seat: e.target.value })}
                >
                  <option value="east">東</option>
                  <option value="south">南</option>
                  <option value="west">西</option>
                  <option value="north">北</option>
                </select>
              </label>
            </div>
          </div>
        );
      case 8:
        {
          // Compute the current score using the helper
          const { han, fu, basePoints, totalPoints } = calculateScore();
          return (
            <div className="space-y-2">
              <p className="text-lg font-semibold">入力内容のまとめ（点数計算を含む）</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>特殊役: {specialHand === 'none' ? 'なし' : specialHand}</li>
                <li>副露: {Object.entries(melds).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'なし'}</li>
                <li>面前面子: {closedMentsu || '未入力'}</li>
                <li>頭: {pair || '未入力'}</li>
                <li>和了牌: {winningTile || '未入力'}</li>
                <li>宣言: {Object.entries(options).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'なし'}</li>
                <li>場風: {winds.prevailing}</li>
                <li>自風: {winds.seat}</li>
                <li>翻 (han): {han}</li>
                <li>符 (fu): {fu}</li>
                <li>基礎点: {basePoints}</li>
                <li>点数: {totalPoints}</li>
              </ul>
              <p className="italic text-gray-500">※ このスコアは簡易計算です。実際の計算には追加の条件が必要です。</p>
            </div>
          );
        }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">麻雀点数計算ウィザード</h1>
      {/* Step indicator */}
      <div className="flex space-x-1 mb-4 overflow-x-auto">
        {stepTitles.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 px-2 py-1 text-xs md:text-sm border rounded ${idx + 1 === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      {/* Step contents */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            onClick={prev}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded"
          >
            戻る
          </button>
        ) : (
          <div />
        )}
        {step < stepTitles.length ? (
          <button
            onClick={next}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            次へ
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default App;