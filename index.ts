import { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Percent } from '@uniswap/sdk'
import { ethers, Wallet } from 'ethers'

const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const init = async () => {
  console.log(`The chainId of "mainnet" is ${ChainId[ChainId.MAINNET]}.`)

  const dai = await Fetcher.fetchTokenData(ChainId.MAINNET, daiAddress)
  const weth = WETH[ChainId.MAINNET]
  const pair = await Fetcher.fetchPairData(dai, weth)
  const route = new Route([pair], weth)
  const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT)

  console.log(`1 ETH = ${route.midPrice.toSignificant(6)} DAI`)
  console.log(`1 DAI = ${route.midPrice.invert().toSignificant(6)} ETH`)
  
  console.log(`Execution price: ${trade.executionPrice.toSignificant(6)} DAI`)
  console.log(`After the trade, the mid price will be: ${trade.nextMidPrice.toSignificant(6)} DAI`)

  const slippageTolerance = new Percent('50', '10000') // 0.005
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
  const path = [weth.address, dai.address]
  const to = ''
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
  const value = trade.inputAmount.raw

  const provider = ethers.getDefaultProvider('mainnet', {
    infura: 'https://rinkeby.infura.io/v3/b2daf36eb4d74aed8ffac330c09dd2ee'
  })
  const signer = Wallet.fromMnemonic('tragic square news business dad cricket nurse athlete tide split about ring')
  const account = signer.connect(provider)
  const uniswap = new ethers.Contract(
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
    account
  )

  console.log(`Trying to call swapExactETHForTokens from account ${signer.address}`)
  try {
    
    const tx = await uniswap.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      { value, gasPrice: 20e9 }
    )

    console.log(`Transaction hash: ${tx.hash}`)

    const receipt = await tx.wait()
    console.log(`Transaction was mined in block ${receipt.blockNumber}`)
  } catch(e) {
    console.log(`Error: ${e}`)
  }
}

init()

