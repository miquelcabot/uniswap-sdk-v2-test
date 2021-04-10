import { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Percent } from '@uniswap/sdk'
import { ethers, Wallet } from 'ethers'

const chainId: ChainId = ChainId.RINKEBY
const daiAddress = '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa'

const init = async () => {
  console.log(`Working with chain ${ChainId[chainId]}.`)

  const dai = await Fetcher.fetchTokenData(chainId, daiAddress)
  const weth = WETH[chainId]
  const pair = await Fetcher.fetchPairData(dai, weth)
  const route = new Route([pair], weth)
  const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT) // 0.1 ETH

  console.log(`1 ETH = ${route.midPrice.toSignificant(6)} DAI`)
  console.log(`1 DAI = ${route.midPrice.invert().toSignificant(6)} ETH`)
  
  console.log(`Execution price: ${trade.executionPrice.toSignificant(6)} DAI`)
  console.log(`After the trade, the mid price will be: ${trade.nextMidPrice.toSignificant(6)} DAI`)

  const slippageTolerance = new Percent('50', '10000') // 0.005
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
  const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString()
  const path = [weth.address, dai.address]
  const to = '0x7d60716Bb7CE4bBa5e5b6dE3125D9553A5F8217C'
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
  const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString()
  const inputAmount = trade.inputAmount.raw
  const inputAmountHex = ethers.BigNumber.from(inputAmount.toString()).toHexString()

  const provider = ethers.getDefaultProvider(ChainId[chainId].toLowerCase(), {
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
      amountOutMinHex,
      path,
      to,
      deadlineHex,
      { 
        value: inputAmountHex, 
        gasPrice: 20e9 
      }
    )
    console.log(`Transaction hash: ${tx.hash}`)

    const receipt = await tx.wait()
    console.log(`Transaction was mined in block ${receipt.blockNumber}`)
  } catch(e) {
    console.log(`Error: ${e}`)
  }
}

init()

