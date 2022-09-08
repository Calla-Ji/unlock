import { Listbox } from '@headlessui/react'
import { useAuth } from '~/contexts/AuthenticationContext'
import { useConfig } from '~/utils/withConfig'

export const NetworkSelection = () => {
  const { networks } = useConfig()
  const { network, changeNetwork } = useAuth()

  const currentNetworkName = networks[network!]?.name

  const onChangeNetwork = (network: number) => {
    changeNetwork(networks[network])
  }
  return (
    <>
      <Listbox value={network} onChange={onChangeNetwork}>
        <div className="relative">
          <label className="block px-1 mb-1 text-base" htmlFor="">
            Network
          </label>
          <Listbox.Button className="box-border flex-1 block w-full py-2 pl-4 text-base text-left transition-all border border-gray-400 rounded-lg shadow-sm hover:border-gray-500 focus:ring-gray-500 focus:border-gray-500 focus:outline-none">
            {currentNetworkName}
          </Listbox.Button>
          <Listbox.Options className="absolute z-10 w-full mt-1 overflow-hidden bg-white border border-gray-400 rounded-xl">
            {Object.values(networks).map(({ id, name }: any) => (
              <Listbox.Option
                key={id}
                value={id}
                className="p-1.5 cursor-pointer odd:bg-gray-50 hover:bg-gray-100"
              >
                {name}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </>
  )
}
