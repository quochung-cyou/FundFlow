export interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export interface BankApiResponse {
  code: string;
  desc: string;
  data: Bank[];
}

let cachedBanks: Bank[] | null = null;

export const fetchVietnameseBanks = async (): Promise<Bank[]> => {
  // Return cached data if available
  if (cachedBanks) {
    return cachedBanks;
  }

  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch banks: ${response.statusText}`);
    }
    
    const data: BankApiResponse = await response.json();
    
    if (data.code !== '00') {
      throw new Error(`API error: ${data.desc}`);
    }
    
    // Cache the results
    cachedBanks = data.data;
    
    return data.data;
  } catch (error) {
    console.error('Error fetching Vietnamese banks:', error);
    // Return fallback data with popular Vietnamese banks
    return [
      {
        id: 1,
        name: "Ngân hàng TMCP Á Châu",
        code: "ACB",
        bin: "970416",
        shortName: "ACB",
        logo: "https://api.vietqr.io/img/ACB.png",
        transferSupported: 1,
        lookupSupported: 1
      },
      {
        id: 2,
        name: "Ngân hàng TMCP Công thương Việt Nam",
        code: "VCB",
        bin: "970436",
        shortName: "Vietcombank",
        logo: "https://api.vietqr.io/img/VCB.png",
        transferSupported: 1,
        lookupSupported: 1
      },
      {
        id: 3,
        name: "Ngân hàng TMCP Kỹ thương Việt Nam",
        code: "TCB",
        bin: "970407",
        shortName: "Techcombank",
        logo: "https://api.vietqr.io/img/TCB.png",
        transferSupported: 1,
        lookupSupported: 1
      }
    ];
  }
};

export const generateQRCodeUrl = (
  bankCode: string,
  accountNumber: string,
  amount?: number,
  description?: string,
  accountName?: string,
  template: 'compact2' | 'compact' | 'qr_only' | 'print' = 'print'
): string => {
  let url = `https://img.vietqr.io/image/${bankCode.toLowerCase()}-${accountNumber}-${template}.png`;
  
  const params = new URLSearchParams();
  
  if (amount && amount > 0) {
    params.append('amount', amount.toString());
  }
  
  if (description) {
    params.append('addInfo', description);
  }
  
  if (accountName) {
    params.append('accountName', accountName);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
};
