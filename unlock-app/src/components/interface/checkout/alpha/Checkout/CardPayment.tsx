import { useAuth } from '~/contexts/AuthenticationContext'
import { CheckoutState, CheckoutSend } from '../useCheckoutState'
import { PaywallConfig } from '~/unlockTypes'
import { LoggedIn, LoggedOut } from '../Bottom'
import { Shell } from '../Shell'
import { useQuery } from 'react-query'
import {
  deleteCardForAddress,
  getCardsForAddress,
  saveCardsForAddress,
} from '~/hooks/useCards'
import { useConfig } from '~/utils/withConfig'
import { Button, Input } from '@unlock-protocol/ui'
import { useWalletService } from '~/utils/withWalletService'
import { useState } from 'react'
import { useAuthenticateHandler } from '~/hooks/useAuthenticateHandler'
import { Card, CardPlaceholder } from '../Card'
import { FieldValues, useForm } from 'react-hook-form'
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { countries } from '~/utils/countries'
import { loadStripe } from '@stripe/stripe-js'

interface Props {
  injectedProvider: unknown
  paywallConfig: PaywallConfig
  send: CheckoutSend
  state: CheckoutState
}

export function CardPayment({ send, injectedProvider }: Props) {
  const { account, deAuthenticate } = useAuth()
  const [editCard, setEditCard] = useState(false)
  const config = useConfig()
  const stripe = loadStripe(config.stripeApiKey, {})
  const walletService = useWalletService()
  const [isSaving, setIsSaving] = useState(false)
  const { isLoading, data, refetch } = useQuery(
    ['cards', account],
    () => getCardsForAddress(config, walletService, account!),
    {
      staleTime: Infinity,
      enabled: !!account,
    }
  )

  const { authenticateWithProvider } = useAuthenticateHandler({
    injectedProvider,
  })

  const card = data?.[0]
  return (
    <>
      <Shell.Content>
        <Elements stripe={stripe}>
          {editCard ? (
            <CardForm
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onSave={async () => {
                await refetch()
                setIsSaving(false)
                setEditCard(false)
              }}
            />
          ) : isLoading || !card ? (
            <CardPlaceholder />
          ) : (
            <Card onChange={() => setEditCard(true)} {...card} />
          )}
        </Elements>
      </Shell.Content>
      <Shell.Footer>
        {account ? (
          <div className="space-y-2">
            {editCard ? (
              <Button
                disabled={!card || isSaving}
                loading={isSaving}
                type="submit"
                form="card-save"
                className="w-full"
              >
                {isSaving ? 'Saving' : 'Save'}
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={!card}
                onClick={() => {
                  send({
                    type: 'SELECT_CARD_TO_CHARGE',
                    cardId: card.id,
                  })
                }}
              >
                Continue
              </Button>
            )}

            <LoggedIn account={account} onDisconnect={() => deAuthenticate()} />
          </div>
        ) : (
          <LoggedOut
            authenticateWithProvider={authenticateWithProvider}
            onUnlockAccount={() => {}}
          />
        )}
      </Shell.Footer>
    </>
  )
}

interface CardFormProps {
  isSaving: boolean
  setIsSaving(value: boolean): void
  onSave(): void
}

function CardForm({ onSave, setIsSaving }: CardFormProps) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm()
  const stripe = useStripe()
  const elements = useElements()
  const { account } = useAuth()
  const config = useConfig()
  const walletService = useWalletService()

  const onSubmit = async (data: FieldValues) => {
    setIsSaving(true)
    const cardElement = elements!.getElement(CardElement)
    const result = await stripe!.createToken(cardElement!, {
      address_country: data.address_country,
      name: data.name,
    })
    if (result.token && account) {
      deleteCardForAddress(config, walletService, account)
      await saveCardsForAddress(config, walletService, account, result.token.id)
    }
    onSave()
  }

  return (
    <form
      id="card-save"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-2"
    >
      <Input
        error={errors?.name?.message}
        size="small"
        label="Name"
        description="Please use the name on your card"
        {...register('name')}
      />
      <div className="space-y-1">
        <label className="pl-1 text-sm" htmlFor="card-element">
          Card
        </label>
        <CardElement id="card-element" />
      </div>
      <div className="space-y-1 pt-2">
        <label className="pl-1 text-sm" htmlFor="card-element">
          Country
        </label>
        <select
          defaultValue="United States"
          {...register('address_country', {
            required: true,
          })}
          className="block border hover:border-gray-500 border-gray-400 text-sm w-full rounded-lg"
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
    </form>
  )
}
