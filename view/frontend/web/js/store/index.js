import Vue from 'vue'
import Vuex from 'vuex'
import regions from '../data/regions.json'
import axios from 'axios'

Vue.use(Vuex)

/* global config, baseUrl */

const store = new Vuex.Store({
  state: {
    config,
    baseUrl,
    regions,
    step: 'shipping',
    paymentMethods: [],
    shippingMethods: [],
    shippingInformation: {
      addressInformation: {
        shipping_address: {},
        billing_address: {},
        shipping_method_code: '',
        shipping_carrier_code: ''
      }
    },
    customer: {
      email: null
    },
    selectedMethods: {
      paymentMethod: {
        method: ''
      },
      shippingCarrierCode: '',
      shippingMethodCode: ''
    },
    totals: {}
  },
  actions: {
    updateShippingMethods ({commit, state, getters}, countryId) {
      const data = {
        'address': {
          'country_id': countryId
        }
      }

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data),
        url: `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/estimate-shipping-methods`
      }

      axios(options)
        .then(({data}) => {
          commit('setShippingMethods', data)
        })
        .catch(error => {
          console.log('Looks like there was a problem: \n', error)
        })
    },
    setShippinInformation ({commit, state, getters}) {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(state.shippingInformation),
        url: `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/shipping-information`
      }

      axios(options)
        .then(({data}) => {
          commit('setPaymentMethods', data.payment_methods)
          commit('setStep', 'payment')
        })
        .catch(error => {
          console.log('Looks like there was a problem: \n', error)
        })
    },
    placeOrder ({commit, state, getters}, paymentMethod) {
      const data = {
        'billingAddress': state.shippingInformation.addressInformation.billing_address,
        'email': state.customer.email,
        'paymentMethod': {
          'method': paymentMethod.code
        }
      }

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data),
        url: `${state.baseUrl}rest/V1/guest-carts/${getters.cartId}/payment-information`
      }

      axios(options)
        .then(({data}) => {
          console.log('Order id: ' + data)
          commit('setStep', 'success')
        })
        .catch(error => {
          console.log('Looks like there was a problem: \n', error)
        })
    }
  },
  mutations: {
    setStep (state, payload) {
      state.step = payload
    },
    setPaymentMethods (state, payload) {
      state.paymentMethods = payload
    },
    setShippingMethods (state, payload) {
      state.shippingMethods = payload
    },
    updateTotals (state, payload) {
      state.totals = payload
    },
    setShippinInformation (state, selectedShippingMethod) {
      state.shippingInformation.addressInformation.billing_address = state.shippingInformation.addressInformation.shipping_address
      state.shippingInformation.addressInformation.shipping_method_code = selectedShippingMethod.method_code
      state.shippingInformation.addressInformation.shipping_carrier_code = selectedShippingMethod.carrier_code
    },
    setCustomerEmail (state, payload) {
      state.customer.email = payload
    },
    setAddress (state, payload) {
      const address = payload.address
      const type = payload.type

      state.shippingInformation.addressInformation[type] = {}
      Object.keys(address).forEach(item => {
        if (item.includes('street')) {
          if (!state.shippingInformation.addressInformation[type].hasOwnProperty('street')) {
            state.shippingInformation.addressInformation[type]['street'] = []
          }
          state.shippingInformation.addressInformation[type]['street'].push(address[item])
        } else {
          if (item === 'region' && address[item] !== '' ||
            item === 'region_id' && address[item] !== '' ||
            item !== 'region' && item !== 'region_id'
          ) {
            state.shippingInformation.addressInformation[type][item] = address[item]
          }
        }
      })
    }
  },
  getters: {
    currencyCode (state) {
      return state.config.totalsData.base_currency_code
    },
    cartId (state) {
      return state.config.quoteData.entity_id
    },
    regionsByCountryId: (state) => (countryId) => {
      return state.regions.filter(region => region.country_id === countryId)
    }
  }
})

export default store
